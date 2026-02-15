import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import styles from "./StockMovementsPage.module.css";
import { useNaming } from "../../i18n/useNaming";
import { useAuthStore } from "../../store/auth.store";
import type { Role, StockMovementListItemResponse, StockMovementType } from "../../services/api/types";
import { getApiErrorMessage } from "../../services/api/errors";
import { getMaxListItems } from "../../config/listMemory";
import { listStockMovements } from "../../services/api/stock.service";
import { getProductById } from "../../services/api/products.service";
import { StockMovementsTable, type StockMovementRow } from "./components/StockMovementsTable";

type MovementTypeFilter = "ALL" | StockMovementType;

function canViewStock(role?: Role) {
  return role === "ADMIN" || role === "VET" || role === "RECEPTION";
}

function parseProductId(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.trunc(n);
}

export function StockMovementsPage() {
  const PAGE_SIZE = 15;
  const MAX_ITEMS_IN_MEMORY = getMaxListItems(PAGE_SIZE);
  const naming = useNaming();
  const me = useAuthStore((s) => s.me);
  const myRole = me?.role;
  const allowed = useMemo(() => canViewStock(myRole), [myRole]);
  const [searchParams, setSearchParams] = useSearchParams();

  const queryProductId = parseProductId(searchParams.get("productId"));

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<StockMovementRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [productIdInput, setProductIdInput] = useState(queryProductId ? String(queryProductId) : "");
  const [productIdFilter, setProductIdFilter] = useState<number | undefined>(queryProductId);
  const [movementTypeFilter, setMovementTypeFilter] = useState<MovementTypeFilter>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [nextPage, setNextPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const loadingRef = useRef(false);
  const productNameCacheRef = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    document.title = `${naming.t("sidebar.stockMovements")} • ${naming.getApp("name")}`;
  }, [naming]);

  useEffect(() => {
    setProductIdInput(queryProductId ? String(queryProductId) : "");
    setProductIdFilter(queryProductId);
  }, [queryProductId]);

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (productIdFilter) next.set("productId", String(productIdFilter));
      else next.delete("productId");
      return next;
    });
  }, [productIdFilter, setSearchParams]);

  async function enrichWithProductName(rows: StockMovementListItemResponse[]): Promise<StockMovementRow[]> {
    const cache = productNameCacheRef.current;
    const missingIds = rows.map((row) => row.productId).filter((id) => !cache.has(id));

    if (missingIds.length) {
      const requests = await Promise.allSettled(missingIds.map((id) => getProductById(id)));
      requests.forEach((result, index) => {
        const id = missingIds[index];
        if (result.status === "fulfilled") {
          cache.set(id, result.value.name);
          return;
        }
        cache.set(id, `#${id}`);
      });
    }

    return rows.map((row) => ({
      ...row,
      productName: cache.get(row.productId) ?? `#${row.productId}`,
    }));
  }

  function dateInRange(createdAt: string, start: string, end: string) {
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return false;

    if (start) {
      const startDate = new Date(`${start}T00:00:00`);
      if (date < startDate) return false;
    }

    if (end) {
      const endDate = new Date(`${end}T23:59:59`);
      if (date > endDate) return false;
    }

    return true;
  }

  function applyClientFilters(
    rows: StockMovementRow[],
    targetMovementType: MovementTypeFilter,
    targetDateFrom: string,
    targetDateTo: string
  ) {
    return rows.filter((row) => {
      if (targetMovementType !== "ALL" && row.movementType !== targetMovementType) return false;
      if (!dateInRange(row.createdAt, targetDateFrom, targetDateTo)) return false;
      return true;
    });
  }

  async function loadMovements(
    startPage: number,
    targetProductId: number | undefined,
    targetMovementType: MovementTypeFilter,
    targetDateFrom: string,
    targetDateTo: string,
    append: boolean
  ) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const acceptedRows: StockMovementRow[] = [];
      let pageCursor = startPage;
      let reachedEnd = false;

      while (acceptedRows.length < PAGE_SIZE && !reachedEnd) {
        const response = await listStockMovements({
          page: pageCursor,
          size: PAGE_SIZE,
          sort: "createdAt,desc",
          productId: targetProductId,
        });

        const content = response.content ?? [];
        const rows = await enrichWithProductName(content);
        const filteredRows = applyClientFilters(rows, targetMovementType, targetDateFrom, targetDateTo);
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
      loadMovements(0, productIdFilter, movementTypeFilter, dateFrom, dateTo, false);
    }, 250);
    return () => clearTimeout(timer);
  }, [allowed, productIdFilter, movementTypeFilter, dateFrom, dateTo]);

  async function handleLoadMore() {
    if (!hasMore || loading) return;
    await loadMovements(nextPage, productIdFilter, movementTypeFilter, dateFrom, dateTo, true);
  }

  if (!allowed) {
    return (
      <div className={styles.page}>
        <div className={styles.denied}>
          <h1>{naming.t("sidebar.stockMovements")}</h1>
          <p>{naming.getMessage("permissionDeniedForAccess")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>{naming.t("sidebar.stockMovements")}</h1>
          <p className={styles.subtitle}>{naming.getMessage("manageStockMovements")}</p>
        </div>

        <div className={styles.filters}>
          <input
            className={styles.input}
            value={productIdInput}
            onChange={(e) => {
              const value = e.target.value.replace(/\D+/g, "");
              setProductIdInput(value);
              setProductIdFilter(parseProductId(value));
            }}
            placeholder={naming.getLabel("productId")}
            aria-label={naming.getLabel("productId")}
            inputMode="numeric"
          />

          <select
            className={styles.select}
            value={movementTypeFilter}
            onChange={(e) => setMovementTypeFilter(e.target.value as MovementTypeFilter)}
            aria-label={naming.getLabel("movementType")}
          >
            <option value="ALL">{naming.getLabel("all")}</option>
            <option value="ENTRY_PURCHASE">{naming.t("stockMovementType.ENTRY_PURCHASE")}</option>
            <option value="EXIT_SALE">{naming.t("stockMovementType.EXIT_SALE")}</option>
            <option value="EXIT_VISIT_CONSUMPTION">{naming.t("stockMovementType.EXIT_VISIT_CONSUMPTION")}</option>
            <option value="ADJUSTMENT">{naming.t("stockMovementType.ADJUSTMENT")}</option>
          </select>

          <input
            className={`${styles.input} ${styles.dateInput}`}
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            aria-label={naming.getLabel("dateFrom")}
          />

          <input
            className={`${styles.input} ${styles.dateInput}`}
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            aria-label={naming.getLabel("dateTo")}
          />

          {productIdFilter && <span className={styles.chip}>{`${naming.getLabel("productId")}: ${productIdFilter}`}</span>}
        </div>
      </header>

      <section className={styles.card}>
        <StockMovementsTable items={items} loading={loading} hasMore={hasMore} error={error} onLoadMore={handleLoadMore} />
      </section>
    </div>
  );
}
