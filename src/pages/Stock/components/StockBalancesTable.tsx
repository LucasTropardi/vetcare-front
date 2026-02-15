import { ArrowsClockwiseIcon, MagnifyingGlassIcon, PlusCircleIcon } from "@phosphor-icons/react";
import { useNaming } from "../../../i18n/useNaming";
import styles from "./StockBalancesTable.module.css";

export type StockBalanceRow = {
  productId: number;
  sku: string;
  name: string;
  onHand: number;
  avgCost: number;
  minStock: number;
  belowMinStock: boolean;
  active: boolean;
};

type Props = {
  items: StockBalanceRow[];
  loading: boolean;
  hasMore: boolean;
  error?: string | null;
  onLoadMore: () => void;
  onOpenMovements: (productId: number) => void;
  onOpenNewMovement: (productId: number) => void;
  onOpenDetail: (productId: number) => void;
};

function formatMoney(value?: number) {
  if (value == null) return "-";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatQuantity(value?: number) {
  if (value == null) return "-";
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(value);
}

export function StockBalancesTable({
  items,
  loading,
  hasMore,
  error,
  onLoadMore,
  onOpenMovements,
  onOpenNewMovement,
  onOpenDetail,
}: Props) {
  const naming = useNaming();

  if (loading && !items.length) return <div className={styles.state}>{naming.getLabel("loading")}</div>;
  if (error && !items.length) return <div className={styles.state}>{error}</div>;
  if (!items.length) return <div className={styles.state}>{naming.getMessage("noStockBalancesFound")}</div>;

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
            <th>{naming.getLabel("sku")}</th>
            <th>{naming.getLabel("name")}</th>
            <th>{naming.getLabel("status")}</th>
            <th className={styles.numericHead}>{naming.getLabel("onHand")}</th>
            <th className={styles.numericHead}>{naming.getLabel("avgCost")}</th>
            <th className={styles.numericHead}>{naming.getLabel("minStock")}</th>
            <th>{naming.getLabel("belowMinimum")}</th>
            <th className={styles.actionsCol}>{naming.getLabel("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.productId}>
              <td className={styles.muted}>{item.sku}</td>
              <td className={styles.nameCell}>{item.name}</td>
              <td>
                <span className={`${styles.statusBadge} ${item.active ? styles.statusActive : styles.statusInactive}`}>
                  {item.active ? naming.getLabel("active") : naming.getLabel("inactive")}
                </span>
              </td>
              <td className={`${styles.muted} ${styles.numericCell}`}>{formatQuantity(item.onHand)}</td>
              <td className={`${styles.muted} ${styles.numericCell}`}>{formatMoney(item.avgCost)}</td>
              <td className={`${styles.muted} ${styles.numericCell}`}>{formatQuantity(item.minStock)}</td>
              <td className={item.belowMinStock ? styles.alertText : styles.muted}>
                {item.belowMinStock ? naming.getLabel("yes") : naming.getLabel("no")}
              </td>
              <td className={styles.actions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => onOpenMovements(item.productId)}
                  title={naming.getLabel("history")}
                >
                  <ArrowsClockwiseIcon size={18} />
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={() => onOpenNewMovement(item.productId)}
                  title={naming.getLabel("newMovement")}
                >
                  <PlusCircleIcon size={18} />
                </button>
                <button className={styles.actionBtn} onClick={() => onOpenDetail(item.productId)} title={naming.getLabel("viewDetail")}>
                  <MagnifyingGlassIcon size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasMore && <div className={styles.moreState}>{naming.getLabel("loading")}</div>}
    </div>
  );
}
