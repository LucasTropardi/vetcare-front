import styles from "./CustomerCompaniesStatsPanel.module.css";
import type { CustomerCompanyStatsResponse } from "../../../services/api/types";
import { useNaming } from "../../../i18n/useNaming";

export type CustomerCompanyStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
export type CustomerCompanyInsightFilter = "ALL" | "WITH_ADDRESS" | "WITH_FISCAL" | "WITHOUT_CONTACT";

type Props = {
  stats?: CustomerCompanyStatsResponse | null;
  loading: boolean;
  statusFilter: CustomerCompanyStatusFilter;
  insightFilter: CustomerCompanyInsightFilter;
  onResetFilters: () => void;
  onStatusFilterChange: (filter: Exclude<CustomerCompanyStatusFilter, "ALL">) => void;
  onInsightFilterChange: (filter: Exclude<CustomerCompanyInsightFilter, "ALL">) => void;
};

export function CustomerCompaniesStatsPanel({
  stats,
  loading,
  statusFilter,
  insightFilter,
  onResetFilters,
  onStatusFilterChange,
  onInsightFilterChange,
}: Props) {
  const naming = useNaming();

  if (loading) {
    return <div className={styles.state}>{naming.getLabel("loading")}</div>;
  }

  if (!stats) {
    return <div className={styles.state}>{naming.getMessage("unknown")}</div>;
  }

  const totalSelected = statusFilter === "ALL" && insightFilter === "ALL";

  return (
    <section className={styles.panel}>
      <h2 className={styles.title}>{naming.getTitle("customerCompanySummary")}</h2>
      <div className={styles.grid}>
        <button
          type="button"
          className={`${styles.kpiCard} ${totalSelected ? styles.kpiCardActive : ""}`}
          onClick={onResetFilters}
        >
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
          className={`${styles.kpiCard} ${insightFilter === "WITH_ADDRESS" ? styles.kpiCardActive : ""}`}
          onClick={() => onInsightFilterChange("WITH_ADDRESS")}
        >
          <span className={styles.kpiLabel}>{naming.getLabel("withAddress")}</span>
          <strong className={styles.kpiValue}>{stats.withAddress}</strong>
        </button>

        <button
          type="button"
          className={`${styles.kpiCard} ${insightFilter === "WITH_FISCAL" ? styles.kpiCardActive : ""}`}
          onClick={() => onInsightFilterChange("WITH_FISCAL")}
        >
          <span className={styles.kpiLabel}>{naming.getLabel("withFiscal")}</span>
          <strong className={styles.kpiValue}>{stats.withFiscal}</strong>
        </button>

        <button
          type="button"
          className={`${styles.kpiCard} ${insightFilter === "WITHOUT_CONTACT" ? styles.kpiCardActive : ""}`}
          onClick={() => onInsightFilterChange("WITHOUT_CONTACT")}
        >
          <span className={styles.kpiLabel}>{naming.getLabel("withoutContact")}</span>
          <strong className={styles.kpiValue}>{stats.withoutContact}</strong>
        </button>
      </div>
    </section>
  );
}
