import styles from "./UsersStatsPanel.module.css";
import type { Role, UserStatsResponse } from "../../../services/api/types";
import { useNaming } from "../../../i18n/useNaming";

export type UsersStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
export type UsersRoleFilter = "ALL" | Role;

type Props = {
  stats?: UserStatsResponse | null;
  loading: boolean;
  statusFilter: UsersStatusFilter;
  roleFilter: UsersRoleFilter;
  onResetFilters: () => void;
  onStatusFilterChange: (filter: Exclude<UsersStatusFilter, "ALL">) => void;
  onRoleFilterChange: (filter: Role) => void;
};

type RoleStat = {
  role: Role;
  count: number;
};

export function UsersStatsPanel({
  stats,
  loading,
  statusFilter,
  roleFilter,
  onResetFilters,
  onStatusFilterChange,
  onRoleFilterChange,
}: Props) {
  const naming = useNaming();

  if (loading) {
    return <div className={styles.state}>{naming.getLabel("loading")}</div>;
  }

  if (!stats) {
    return <div className={styles.state}>{naming.getMessage("unknown")}</div>;
  }

  const roleStats: RoleStat[] = [
    { role: "ADMIN", count: stats.admin },
    { role: "VET", count: stats.vet },
    { role: "RECEPTION", count: stats.reception },
  ];
  const totalSelected = statusFilter === "ALL" && roleFilter === "ALL";

  return (
    <section className={styles.panel}>
      <h2 className={styles.title}>{naming.getTitle("userSummary")}</h2>
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
        {roleStats.map((item) => (
          <button
            type="button"
            className={`${styles.kpiCard} ${roleFilter === item.role ? styles.kpiCardActive : ""}`}
            key={item.role}
            onClick={() => onRoleFilterChange(item.role)}
          >
            <span className={styles.kpiLabel}>{naming.getRole(item.role)}</span>
            <strong className={styles.kpiValue}>{item.count}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}
