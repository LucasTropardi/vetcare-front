import styles from "./RoleBadge.module.css";
import type { Role } from "../../../services/api/types"; 

export function RoleBadge({ role }: { role: Role }) {
  return <span className={styles.badge} data-role={role}>{role}</span>;
}
