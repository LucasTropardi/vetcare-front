import styles from "./UsersStatsPanel.module.css";
import type { Role, UserStatsResponse } from "../../../services/api/types";
import { useNaming } from "../../../i18n/useNaming";

type Props = {
  stats?: UserStatsResponse | null;
  loading: boolean;
};

type RoleStat = {
  role: Role;
  count: number;
};

export function UsersStatsPanel({ stats, loading }: Props) {
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

  const maxRoleCount = Math.max(...roleStats.map((item) => item.count), 1);

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <h2 className={styles.title}>{naming.getTitle("userSummary")}</h2>
        <p className={styles.subtitle}>{naming.getMessage("userSummarySubtitle")}</p>
      </header>

      <div className={styles.kpiGrid}>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>{naming.getLabel("total")}</span>
          <strong className={styles.kpiValue}>{stats.total}</strong>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>{naming.getLabel("active")}</span>
          <strong className={styles.kpiValue}>{stats.active}</strong>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>{naming.getLabel("inactive")}</span>
          <strong className={styles.kpiValue}>{stats.inactive}</strong>
        </article>
      </div>

      <div className={styles.roleArea}>
        <h3 className={styles.roleTitle}>{naming.getLabel("usersByRole")}</h3>
        <div className={styles.roleList}>
          {roleStats.map((item) => (
            <div className={styles.roleRow} key={item.role}>
              <span className={styles.roleName}>{naming.getRole(item.role)}</span>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ width: `${(item.count / maxRoleCount) * 100}%` }}
                />
              </div>
              <strong className={styles.roleCount}>{item.count}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
