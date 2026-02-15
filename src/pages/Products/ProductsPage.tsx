import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./ProductsPage.module.css";
import { useNaming } from "../../i18n/useNaming";
import { useAuthStore } from "../../store/auth.store";
import { useConfirmStore } from "../../store/confirm.store";
import type { ProductCategory, ProductListItemResponse, Role } from "../../services/api/types";
import { getApiErrorMessage } from "../../services/api/errors";
import { getMaxListItems } from "../../config/listMemory";
import { listProducts, setProductActive } from "../../services/api/products.service";
import { ProductsTable } from "./components/ProductsTable";
import { ProductFormModal } from "./components/ProductFormModal";
import {
  ProductsStatsPanel,
  type ProductCategoryFilter,
  type ProductStatusFilter,
  type ProductStats,
} from "./components/ProductsStatsPanel";

function canManageProducts(role?: Role) {
  return role === "ADMIN" || role === "VET" || role === "RECEPTION";
}

function canDeactivateProduct(role?: Role) {
  return role === "ADMIN" || role === "VET";
}

export function ProductsPage() {
  const PAGE_SIZE = 15;
  const MAX_ITEMS_IN_MEMORY = getMaxListItems(PAGE_SIZE);
  const naming = useNaming();
  const me = useAuthStore((s) => s.me);
  const confirm = useConfirmStore((s) => s.confirm);

  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [products, setProducts] = useState<ProductListItemResponse[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<ProductCategoryFilter>("ALL");
  const [modal, setModal] = useState<{ open: boolean; productId?: number }>({ open: false });

  const loadingRef = useRef(false);
  const myRole = me?.role;
  const allowed = useMemo(() => canManageProducts(myRole), [myRole]);

  async function load(
    targetPage = page,
    targetQuery = query,
    targetStatus = statusFilter,
    targetCategory = categoryFilter,
    append = false
  ) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const response = await listProducts({
        page: targetPage,
        size: PAGE_SIZE,
        sort: "name,asc",
        name: targetQuery.trim() || undefined,
        active: targetStatus === "ACTIVE" ? true : targetStatus === "INACTIVE" ? false : undefined,
        category: targetCategory === "ALL" ? undefined : targetCategory,
      });

      const content = response.content ?? [];
      setProducts((prev) => {
        if (!append) return content;
        const merged = [...prev, ...content];
        if (merged.length <= MAX_ITEMS_IN_MEMORY) return merged;
        return merged.slice(merged.length - MAX_ITEMS_IN_MEMORY);
      });
      setPage(response.number ?? targetPage);
      setTotalPages(response.totalPages ?? 0);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }

  async function countProducts(params?: { active?: boolean; category?: ProductCategory }) {
    const response = await listProducts({
      ...params,
      page: 0,
      size: 1,
      sort: "name,asc",
    });
    return response.totalElements ?? 0;
  }

  async function loadStats() {
    setStatsLoading(true);
    try {
      const [total, active, inactive, medicine, supply, feed, other] = await Promise.all([
        countProducts(),
        countProducts({ active: true }),
        countProducts({ active: false }),
        countProducts({ category: "MEDICINE" }),
        countProducts({ category: "SUPPLY" }),
        countProducts({ category: "FEED" }),
        countProducts({ category: "OTHER" }),
      ]);

      setStats({ total, active, inactive, medicine, supply, feed, other });
    } catch (error) {
      console.log("Error loading products stats:", error);
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }

  useEffect(() => {
    document.title = `${naming.getTitle("products")} • ${naming.getApp("name")}`;
  }, [naming]);

  useEffect(() => {
    const timer = setTimeout(() => load(0, query, statusFilter, categoryFilter), 250);
    return () => clearTimeout(timer);
  }, [query, statusFilter, categoryFilter]);

  useEffect(() => {
    loadStats();
  }, []);

  async function handleDeactivate(id: number) {
    if (!canDeactivateProduct(myRole)) return;

    const ok = await confirm({
      title: naming.getTitle("deactivateProduct"),
      message: naming.getMessage("deactivateProductConfirm"),
      confirmText: naming.getLabel("deactivate"),
      cancelText: naming.getLabel("cancel"),
      danger: true,
    });
    if (!ok) return;

    try {
      await setProductActive(id, false);
      await Promise.all([load(0, query, statusFilter, categoryFilter), loadStats()]);
    } catch (error) {
      const apiMsg = getApiErrorMessage(error);
      await confirm({
        title: naming.getTitle("errorSavingProduct"),
        message: apiMsg ?? naming.getMessage("unknown"),
        confirmText: naming.getLabel("ok"),
      });
    }
  }

  async function handleLoadMore() {
    if (loading || page + 1 >= totalPages) return;
    await load(page + 1, query, statusFilter, categoryFilter, true);
  }

  if (!allowed) {
    return (
      <div className={styles.page}>
        <div className={styles.denied}>
          <h1>{naming.getTitle("products")}</h1>
          <p>{naming.getMessage("permissionDeniedForAccess")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>{naming.getTitle("products")}</h1>
          <p className={styles.subtitle}>{naming.getMessage("manageProducts")}</p>
        </div>

        <div className={styles.headerRight}>
          <input
            className={styles.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={naming.getMessage("searchProducts")}
            aria-label={naming.getMessage("searchProducts")}
          />

          <button className={styles.primaryBtn} onClick={() => setModal({ open: true })}>
            {naming.getTitle("newProduct")}
          </button>
        </div>
      </header>

      <ProductsStatsPanel
        stats={stats}
        loading={statsLoading}
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
        onResetFilters={() => {
          setStatusFilter("ALL");
          setCategoryFilter("ALL");
        }}
        onStatusFilterChange={(filter) => setStatusFilter((prev) => (prev === filter ? "ALL" : filter))}
        onCategoryFilterChange={(filter) => setCategoryFilter((prev) => (prev === filter ? "ALL" : filter))}
      />

      <section className={styles.card}>
        <ProductsTable
          products={products}
          loading={loading}
          hasMore={page + 1 < totalPages}
          currentRole={myRole}
          onEdit={(id) => setModal({ open: true, productId: id })}
          onDeactivate={handleDeactivate}
          onLoadMore={handleLoadMore}
        />
      </section>

      {modal.open && (
        <ProductFormModal
          productId={modal.productId}
          onClose={() => setModal({ open: false })}
          onSaved={async () => {
            setModal({ open: false });
            await Promise.all([load(0, query, statusFilter, categoryFilter), loadStats()]);
          }}
        />
      )}
    </div>
  );
}
