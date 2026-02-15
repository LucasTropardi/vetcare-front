import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import styles from "./StockProductDetailPage.module.css";
import { useNaming } from "../../i18n/useNaming";
import { useAuthStore } from "../../store/auth.store";
import type { ProductListItemResponse, Role } from "../../services/api/types";
import { ProductLookupModal } from "./components/ProductLookupModal";
import { getApiErrorMessage } from "../../services/api/errors";
import { getProductById } from "../../services/api/products.service";
import { getStockBalance, listStockMovements } from "../../services/api/stock.service";
import { StockMovementsTable, type StockMovementRow } from "./components/StockMovementsTable";

function canViewStock(role?: Role) {
  return role === "ADMIN" || role === "VET" || role === "RECEPTION";
}

function parseProductId(value: string | null): string {
  if (!value) return "";
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "";
  return String(Math.trunc(n));
}

function formatMoney(value?: number) {
  if (value == null) return "-";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatQuantity(value?: number) {
  if (value == null) return "-";
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(value);
}

export function StockProductDetailPage() {
  const naming = useNaming();
  const me = useAuthStore((s) => s.me);
  const allowed = useMemo(() => canViewStock(me?.role), [me?.role]);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryProductId = parseProductId(searchParams.get("productId"));

  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<ProductListItemResponse | null>(null);
  const [onHand, setOnHand] = useState(0);
  const [avgCost, setAvgCost] = useState(0);
  const [movements, setMovements] = useState<StockMovementRow[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    document.title = `${naming.t("sidebar.stockProductDetail")} • ${naming.getApp("name")}`;
  }, [naming]);

  async function loadProductContext(productId: number) {
    setLoading(true);
    setError(null);
    try {
      const product = await getProductById(productId);
      setSelectedProduct({
        id: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        unit: product.unit,
        active: product.active,
        salePrice: product.salePrice,
        costPrice: product.costPrice,
        minStock: product.minStock,
      });

      try {
        const balance = await getStockBalance(productId);
        setOnHand(balance.onHand ?? 0);
        setAvgCost(balance.avgCost ?? 0);
      } catch (balanceErr) {
        if (axios.isAxiosError(balanceErr) && balanceErr.response?.status === 404) {
          setOnHand(0);
          setAvgCost(0);
        } else {
          throw balanceErr;
        }
      }

      const movementResponse = await listStockMovements({
        productId,
        page: 0,
        size: 15,
        sort: "createdAt,desc",
      });
      const rows: StockMovementRow[] = (movementResponse.content ?? []).map((m) => ({
        ...m,
        productName: product.name,
      }));
      setMovements(rows);
      setPage(movementResponse.number ?? 0);
      setTotalPages(movementResponse.totalPages ?? 0);
    } catch (err) {
      const apiMsg = getApiErrorMessage(err);
      setError(apiMsg ?? naming.getMessage("unknown"));
      setSelectedProduct(null);
      setOnHand(0);
      setAvgCost(0);
      setMovements([]);
      setPage(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!queryProductId) {
      setSelectedProduct(null);
      setOnHand(0);
      setAvgCost(0);
      setMovements([]);
      setPage(0);
      setTotalPages(0);
      return;
    }
    loadProductContext(Number(queryProductId));
  }, [queryProductId]);

  async function handleLoadMoreMovements() {
    if (!selectedProduct || movementsLoading || page + 1 >= totalPages) return;
    setMovementsLoading(true);
    try {
      const response = await listStockMovements({
        productId: selectedProduct.id,
        page: page + 1,
        size: 15,
        sort: "createdAt,desc",
      });
      const rows: StockMovementRow[] = (response.content ?? []).map((m) => ({
        ...m,
        productName: selectedProduct.name,
      }));
      setMovements((prev) => [...prev, ...rows]);
      setPage(response.number ?? page + 1);
      setTotalPages(response.totalPages ?? totalPages);
    } finally {
      setMovementsLoading(false);
    }
  }

  const isBelowMinimum = Boolean(selectedProduct && selectedProduct.minStock > 0 && onHand < selectedProduct.minStock);

  if (!allowed) {
    return (
      <div className={styles.page}>
        <div className={styles.denied}>
          <h1>{naming.t("sidebar.stockProductDetail")}</h1>
          <p>{naming.getMessage("permissionDeniedForAccess")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{naming.t("sidebar.stockProductDetail")}</h1>
          <p className={styles.subtitle}>{naming.getMessage("manageStockProductDetail")}</p>
        </div>
      </header>

      <div className={styles.productCard}>
        <div className={styles.productInfo}>
          <div className={styles.productLabel}>{naming.getLabel("selectedProduct")}</div>
          {selectedProduct ? (
            <>
              <div className={styles.productName}>{selectedProduct.name}</div>
              <div className={styles.productMeta}>{`#${selectedProduct.id} • ${selectedProduct.sku}`}</div>
            </>
          ) : (
            <div className={styles.productEmpty}>{naming.getMessage("stockNoProductSelected")}</div>
          )}
        </div>
        <div className={styles.productActions}>
          <button className={styles.secondaryBtn} onClick={() => setPickerOpen(true)}>
            {selectedProduct ? naming.getLabel("changeProduct") : naming.getLabel("selectProduct")}
          </button>
          {selectedProduct && (
            <button
              className={styles.secondaryBtn}
              onClick={() =>
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.delete("productId");
                  return next;
                })
              }
            >
              {naming.getLabel("clearProduct")}
            </button>
          )}
        </div>
      </div>

      <section className={styles.movementsCard}>
        {loading ? (
          <div className={styles.loading}>{naming.getLabel("loading")}</div>
        ) : !selectedProduct ? (
          <div className={styles.state}>{naming.getMessage("stockSelectProductToViewDetail")}</div>
        ) : (
          <>
            <div className={styles.kpis}>
              <article className={styles.kpiCard}>
                <span className={styles.kpiLabel}>{naming.getLabel("onHand")}</span>
                <p className={styles.kpiValue}>{formatQuantity(onHand)}</p>
              </article>
              <article className={styles.kpiCard}>
                <span className={styles.kpiLabel}>{naming.getLabel("avgCost")}</span>
                <p className={styles.kpiValue}>{formatMoney(avgCost)}</p>
              </article>
              <article className={styles.kpiCard}>
                <span className={styles.kpiLabel}>{naming.getLabel("minStock")}</span>
                <p className={styles.kpiValue}>{formatQuantity(selectedProduct.minStock)}</p>
              </article>
            </div>

            {isBelowMinimum ? (
              <div className={styles.dangerAlert}>{naming.getMessage("stockBelowMinimumAlert")}</div>
            ) : (
              <div className={styles.alert}>{naming.getMessage("stockMinimumOkAlert")}</div>
            )}

            {error && <div className={styles.dangerAlert}>{error}</div>}

            <div className={styles.movementsHeader}>
              <h2 className={styles.movementsTitle}>{naming.getLabel("latestMovements")}</h2>
            </div>
            <StockMovementsTable
              items={movements}
              loading={movementsLoading}
              hasMore={page + 1 < totalPages}
              onLoadMore={handleLoadMoreMovements}
            />
          </>
        )}
      </section>

      {pickerOpen && (
        <ProductLookupModal
          onClose={() => setPickerOpen(false)}
          onSelect={(product) => {
            setPickerOpen(false);
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set("productId", String(product.id));
              return next;
            });
          }}
        />
      )}
    </div>
  );
}
