import styles from "./ProductsStatsPanel.module.css";
import { useNaming } from "../../../i18n/useNaming";

export type ProductStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
export type ProductCategoryFilter = "ALL" | "MEDICINE" | "SUPPLY" | "FEED" | "OTHER";

export type ProductStats = {
  total: number;
  active: number;
  inactive: number;
  medicine: number;
  supply: number;
  feed: number;
  other: number;
};

type Props = {
  stats?: ProductStats | null;
  loading: boolean;
  statusFilter: ProductStatusFilter;
  categoryFilter: ProductCategoryFilter;
  onResetFilters: () => void;
  onStatusFilterChange: (filter: Exclude<ProductStatusFilter, "ALL">) => void;
  onCategoryFilterChange: (filter: Exclude<ProductCategoryFilter, "ALL">) => void;
};

export function ProductsStatsPanel({
  stats,
  loading,
  statusFilter,
  categoryFilter,
  onResetFilters,
  onStatusFilterChange,
  onCategoryFilterChange,
}: Props) {
  const naming = useNaming();

  if (loading) {
    return <div className={styles.state}>{naming.getLabel("loading")}</div>;
  }

  if (!stats) {
    return <div className={styles.state}>{naming.getMessage("unknown")}</div>;
  }

  const totalSelected = statusFilter === "ALL" && categoryFilter === "ALL";

  return (
    <section className={styles.panel}>
      <h2 className={styles.title}>{naming.getTitle("productsSummary")}</h2>
      <div className={styles.grid}>
        <button type="button" className={`${styles.kpiCard} ${totalSelected ? styles.kpiCardActive : ""}`} onClick={onResetFilters}>
          <span className={styles.kpiLabel}>{naming.getLabel("total")}</span>
          <strong className={styles.kpiValue}>{stats.total}</strong>
        </button>

        <button
          type="button"
          className={`${styles.kpiCard} ${statusFilter === "ACTIVE" ? styles.kpiCardActive : ""}`}
          onClick={() => onStatusFilterChange("ACTIVE")}
        >
          <span className={styles.kpiLabel}>{naming.getLabel("active")}</span>
          <strong className={styles.kpiValue}>{stats.active}</strong>
        </button>

        <button
          type="button"
          className={`${styles.kpiCard} ${statusFilter === "INACTIVE" ? styles.kpiCardActive : ""}`}
          onClick={() => onStatusFilterChange("INACTIVE")}
        >
          <span className={styles.kpiLabel}>{naming.getLabel("inactive")}</span>
          <strong className={styles.kpiValue}>{stats.inactive}</strong>
        </button>

        <button
          type="button"
          className={`${styles.kpiCard} ${categoryFilter === "MEDICINE" ? styles.kpiCardActive : ""}`}
          onClick={() => onCategoryFilterChange("MEDICINE")}
        >
          <span className={styles.kpiLabel}>{naming.t("productCategory.MEDICINE")}</span>
          <strong className={styles.kpiValue}>{stats.medicine}</strong>
        </button>

        <button
          type="button"
          className={`${styles.kpiCard} ${categoryFilter === "SUPPLY" ? styles.kpiCardActive : ""}`}
          onClick={() => onCategoryFilterChange("SUPPLY")}
        >
          <span className={styles.kpiLabel}>{naming.t("productCategory.SUPPLY")}</span>
          <strong className={styles.kpiValue}>{stats.supply}</strong>
        </button>

        <button
          type="button"
          className={`${styles.kpiCard} ${categoryFilter === "FEED" ? styles.kpiCardActive : ""}`}
          onClick={() => onCategoryFilterChange("FEED")}
        >
          <span className={styles.kpiLabel}>{naming.t("productCategory.FEED")}</span>
          <strong className={styles.kpiValue}>{stats.feed}</strong>
        </button>

        <button
          type="button"
          className={`${styles.kpiCard} ${categoryFilter === "OTHER" ? styles.kpiCardActive : ""}`}
          onClick={() => onCategoryFilterChange("OTHER")}
        >
          <span className={styles.kpiLabel}>{naming.t("productCategory.OTHER")}</span>
          <strong className={styles.kpiValue}>{stats.other}</strong>
        </button>
      </div>
    </section>
  );
}
