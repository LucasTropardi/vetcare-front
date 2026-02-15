import { useNaming } from "../../../i18n/useNaming";
import type { StockMovementType } from "../../../services/api/types";
import styles from "./StockMovementsTable.module.css";

export type StockMovementRow = {
  id: number;
  productId: number;
  productName: string;
  movementType: StockMovementType;
  quantity: number;
  unitCost?: number | null;
  notes?: string | null;
  referenceType?: string | null;
  referenceId?: number | null;
  createdBy: number;
  createdAt: string;
};

type Props = {
  items: StockMovementRow[];
  loading: boolean;
  hasMore: boolean;
  error?: string | null;
  onLoadMore: () => void;
};

function formatDateTime(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

function formatMoney(value?: number | null) {
  if (value == null) return "-";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatQuantity(value?: number) {
  if (value == null) return "-";
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(value);
}

function typeClass(type: StockMovementType) {
  if (type === "ENTRY_PURCHASE") return styles.typeEntry;
  if (type === "ADJUSTMENT") return styles.typeAdjust;
  return styles.typeExit;
}

export function StockMovementsTable({ items, loading, hasMore, error, onLoadMore }: Props) {
  const naming = useNaming();

  if (loading && !items.length) return <div className={styles.state}>{naming.getLabel("loading")}</div>;
  if (error && !items.length) return <div className={styles.state}>{error}</div>;
  if (!items.length) return <div className={styles.state}>{naming.getMessage("noStockMovementsFound")}</div>;

  return (
    <div
      className={styles.tableWrap}
      onScroll={(e) => {
        if (!hasMore || loading) return;
        const target = e.currentTarget;
        const reachedBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 80;
        if (reachedBottom) onLoadMore();
      }}
    >
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{naming.getLabel("dateTime")}</th>
            <th>{naming.getLabel("product")}</th>
            <th>{naming.getLabel("movementType")}</th>
            <th className={styles.numericHead}>{naming.getLabel("quantity")}</th>
            <th className={styles.numericHead}>{naming.getLabel("unitCost")}</th>
            <th>{naming.getLabel("reference")}</th>
            <th className={styles.numericHead}>{naming.getLabel("createdBy")}</th>
            <th>{naming.getLabel("notes")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className={styles.muted}>{formatDateTime(item.createdAt)}</td>
              <td className={styles.nameCell}>{item.productName}</td>
              <td>
                <span className={`${styles.typeBadge} ${typeClass(item.movementType)}`}>
                  {naming.t(`stockMovementType.${item.movementType}`)}
                </span>
              </td>
              <td className={`${styles.numericCell} ${item.quantity >= 0 ? styles.qtyPositive : styles.qtyNegative}`}>
                {formatQuantity(item.quantity)}
              </td>
              <td className={`${styles.muted} ${styles.numericCell}`}>{formatMoney(item.unitCost)}</td>
              <td className={styles.muted}>
                {item.referenceType ? `${item.referenceType}${item.referenceId ? ` #${item.referenceId}` : ""}` : "-"}
              </td>
              <td className={`${styles.muted} ${styles.numericCell}`}>{item.createdBy}</td>
              <td className={styles.muted}>{item.notes?.trim() || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasMore && <div className={styles.moreState}>{naming.getLabel("loading")}</div>}
    </div>
  );
}
