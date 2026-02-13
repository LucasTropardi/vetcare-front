import styles from "./PetsStatsPanel.module.css";
import type { PetStatsResponse } from "../../../services/api/types";
import { useNaming } from "../../../i18n/useNaming";

export type PetStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
export type PetSpeciesFilter = "ALL" | "DOG" | "CAT" | "OTHER";

type Props = {
  stats?: PetStatsResponse | null;
  loading: boolean;
  statusFilter: PetStatusFilter;
  speciesFilter: PetSpeciesFilter;
  onResetFilters: () => void;
  onStatusFilterChange: (filter: Exclude<PetStatusFilter, "ALL">) => void;
  onSpeciesFilterChange: (filter: Exclude<PetSpeciesFilter, "ALL">) => void;
};

export function PetsStatsPanel({
  stats,
  loading,
  statusFilter,
  speciesFilter,
  onResetFilters,
  onStatusFilterChange,
  onSpeciesFilterChange,
}: Props) {
  const naming = useNaming();

  if (loading) {
    return <div className={styles.state}>{naming.getLabel("loading")}</div>;
  }

  if (!stats) {
    return <div className={styles.state}>{naming.getMessage("unknown")}</div>;
  }

  const totalSelected = statusFilter === "ALL" && speciesFilter === "ALL";

  return (
    <section className={styles.panel}>
      <h2 className={styles.title}>{naming.getTitle("petSummary")}</h2>
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
          <span className={styles.kpiLabel}>{naming.getLabel("petInFollowUp")}</span>
          <strong className={styles.kpiValue}>{stats.active}</strong>
        </button>
        <button
          type="button"
          className={`${styles.kpiCard} ${statusFilter === "INACTIVE" ? styles.kpiCardActive : ""}`}
          onClick={() => onStatusFilterChange("INACTIVE")}
        >
          <span className={styles.kpiLabel}>{naming.getLabel("petInactive")}</span>
          <strong className={styles.kpiValue}>{stats.inactive}</strong>
        </button>
        <button
          type="button"
          className={`${styles.kpiCard} ${speciesFilter === "DOG" ? styles.kpiCardActive : ""}`}
          onClick={() => onSpeciesFilterChange("DOG")}
        >
          <span className={styles.kpiLabel}>{naming.getLabel("dogs")}</span>
          <strong className={styles.kpiValue}>{stats.dogs}</strong>
        </button>
        <button
          type="button"
          className={`${styles.kpiCard} ${speciesFilter === "CAT" ? styles.kpiCardActive : ""}`}
          onClick={() => onSpeciesFilterChange("CAT")}
        >
          <span className={styles.kpiLabel}>{naming.getLabel("cats")}</span>
          <strong className={styles.kpiValue}>{stats.cats}</strong>
        </button>
        <button
          type="button"
          className={`${styles.kpiCard} ${speciesFilter === "OTHER" ? styles.kpiCardActive : ""}`}
          onClick={() => onSpeciesFilterChange("OTHER")}
        >
          <span className={styles.kpiLabel}>{naming.getLabel("others")}</span>
          <strong className={styles.kpiValue}>{stats.others}</strong>
        </button>
      </div>
    </section>
  );
}
