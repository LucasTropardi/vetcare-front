import styles from "./TutorsStatsPanel.module.css";
import type { TutorStatsResponse } from "../../../services/api/types";
import { useNaming } from "../../../i18n/useNaming";

export type TutorStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
export type TutorInsightFilter = "ALL" | "WITH_COMPANY" | "WITH_PET" | "WITHOUT_CONTACT";

type Props = {
  stats?: TutorStatsResponse | null;
  loading: boolean;
  statusFilter: TutorStatusFilter;
  insightFilter: TutorInsightFilter;
  onResetFilters: () => void;
  onStatusFilterChange: (filter: Exclude<TutorStatusFilter, "ALL">) => void;
  onInsightFilterChange: (filter: Exclude<TutorInsightFilter, "ALL">) => void;
};

export function TutorsStatsPanel({
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
      <h2 className={styles.title}>{naming.getTitle("tutorSummary")}</h2>
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
          className={`${styles.kpiCard} ${insightFilter === "WITH_COMPANY" ? styles.kpiCardActive : ""}`}
          onClick={() => onInsightFilterChange("WITH_COMPANY")}
        >
          <span className={styles.kpiLabel}>{naming.getLabel("withCompany")}</span>
          <strong className={styles.kpiValue}>{stats.withCompany}</strong>
        </button>

        <button
          type="button"
          className={`${styles.kpiCard} ${insightFilter === "WITH_PET" ? styles.kpiCardActive : ""}`}
          onClick={() => onInsightFilterChange("WITH_PET")}
        >
          <span className={styles.kpiLabel}>{naming.getLabel("withPet")}</span>
          <strong className={styles.kpiValue}>{stats.withPet}</strong>
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
