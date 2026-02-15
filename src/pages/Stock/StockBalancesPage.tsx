import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./StockBalancesPage.module.css";
import { useNaming } from "../../i18n/useNaming";
import { useAuthStore } from "../../store/auth.store";
import { getMaxListItems } from "../../config/listMemory";
import { listStockBalances } from "../../services/api/stock.service";
import type { Role, StockBalanceListItemResponse } from "../../services/api/types";
import { getApiErrorMessage } from "../../services/api/errors";
import { getProductById } from "../../services/api/products.service";
import { StockBalancesTable, type StockBalanceRow } from "./components/StockBalancesTable";

type ProductStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

function canViewStock(role?: Role) {
  return role === "ADMIN" || role === "VET" || role === "RECEPTION";
}

export function StockBalancesPage() {
  const PAGE_SIZE = 15;
  const MAX_ITEMS_IN_MEMORY = getMaxListItems(PAGE_SIZE);
  const naming = useNaming();
  const me = useAuthStore((s) => s.me);
  const navigate = useNavigate();
  const myRole = me?.role;
  const allowed = useMemo(() => canViewStock(myRole), [myRole]);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<StockBalanceRow[]>([]);
  const [query, setQuery] = useState("");
  const [belowMinOnly, setBelowMinOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>("ALL");
  const [error, setError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const loadingRef = useRef(false);
  const productStatusCacheRef = useRef<Map<number, boolean>>(new Map());

  useEffect(() => {
    document.title = `${naming.t("sidebar.stockBalances")} • ${naming.getApp("name")}`;
  }, [naming]);

  async function enrichWithProductStatus(rows: StockBalanceListItemResponse[]): Promise<StockBalanceRow[]> {
    const cache = productStatusCacheRef.current;
    const missingIds = rows.map((row) => row.productId).filter((id) => !cache.has(id));

    if (missingIds.length) {
      const requests = await Promise.allSettled(missingIds.map((id) => getProductById(id)));
      requests.forEach((result, index) => {
        const id = missingIds[index];
        if (result.status === "fulfilled") {
          cache.set(id, Boolean(result.value.active));
          return;
        }
        cache.set(id, false);
      });
    }

    return rows.map((row) => ({
      ...row,
      active: cache.get(row.productId) ?? false,
    }));
  }

  function filterByProductStatus(rows: StockBalanceRow[], targetStatus: ProductStatusFilter) {
    if (targetStatus === "ALL") return rows;
    return rows.filter((row) => (targetStatus === "ACTIVE" ? row.active : !row.active));
  }

  async function loadBalances(
    startPage: number,
    targetQuery: string,
    targetBelowMinOnly: boolean,
    targetStatusFilter: ProductStatusFilter,
    append: boolean
  ) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const acceptedRows: StockBalanceRow[] = [];
      let pageCursor = startPage;
      let reachedEnd = false;

      while (acceptedRows.length < PAGE_SIZE && !reachedEnd) {
        const response = await listStockBalances({
          page: pageCursor,
          size: PAGE_SIZE,
          query: targetQuery.trim() || undefined,
          belowMinStock: targetBelowMinOnly ? true : undefined,
        });

        const content = response.content ?? [];
        const rowsWithStatus = await enrichWithProductStatus(content);
        const filteredRows = filterByProductStatus(rowsWithStatus, targetStatusFilter);
        acceptedRows.push(...filteredRows);

        pageCursor += 1;
        reachedEnd = Boolean(response.last) || pageCursor >= (response.totalPages ?? 0);
      }

      setItems((prev) => {
        if (!append) return acceptedRows;
        const merged = [...prev, ...acceptedRows];
        if (merged.length <= MAX_ITEMS_IN_MEMORY) return merged;
        return merged.slice(merged.length - MAX_ITEMS_IN_MEMORY);
      });

      setNextPage(pageCursor);
      setHasMore(!reachedEnd);
    } catch (err) {
      const apiMsg = getApiErrorMessage(err);
      setError(apiMsg ?? naming.getMessage("unknown"));
      if (!append) {
        setItems([]);
        setHasMore(false);
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!allowed) return;
    const timer = setTimeout(() => {
      loadBalances(0, query, belowMinOnly, statusFilter, false);
    }, 250);
    return () => clearTimeout(timer);
  }, [allowed, query, belowMinOnly, statusFilter]);

  async function handleLoadMore() {
    if (!hasMore || loading) return;
    await loadBalances(nextPage, query, belowMinOnly, statusFilter, true);
  }

  function goToProductRoute(path: string, productId: number) {
    navigate(`${path}?productId=${productId}`);
  }

  if (!allowed) {
    return (
      <div className={styles.page}>
        <div className={styles.denied}>
          <h1>{naming.t("sidebar.stockBalances")}</h1>
          <p>{naming.getMessage("permissionDeniedForAccess")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>{naming.t("sidebar.stockBalances")}</h1>
          <p className={styles.subtitle}>{naming.getMessage("manageStockBalances")}</p>
        </div>

        <div className={styles.filters}>
          <input
            className={styles.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={naming.getMessage("searchStockBalances")}
            aria-label={naming.getMessage("searchStockBalances")}
          />

          <select
            className={styles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProductStatusFilter)}
            aria-label={naming.getLabel("status")}
          >
            <option value="ALL">{naming.getLabel("all")}</option>
            <option value="ACTIVE">{naming.getLabel("active")}</option>
            <option value="INACTIVE">{naming.getLabel("inactive")}</option>
          </select>

          <label className={styles.checkboxWrap}>
            <input
              className={styles.checkbox}
              type="checkbox"
              checked={belowMinOnly}
              onChange={(e) => setBelowMinOnly(e.target.checked)}
            />
            <span>{naming.getLabel("onlyBelowMinimum")}</span>
          </label>
        </div>
      </header>

      <section className={styles.card}>
        <StockBalancesTable
          items={items}
          loading={loading}
          hasMore={hasMore}
          error={error}
          onLoadMore={handleLoadMore}
          onOpenMovements={(productId) => goToProductRoute("/stock/movements", productId)}
          onOpenNewMovement={(productId) => goToProductRoute("/stock/new-movement", productId)}
          onOpenDetail={(productId) => goToProductRoute("/stock/product-view", productId)}
        />
      </section>
    </div>
  );
}
