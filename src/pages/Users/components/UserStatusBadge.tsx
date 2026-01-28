import styles from "./UserStatusBadge.module.css";

export function UserStatusBadge({ active }: { active: boolean }) {
  return (
    <span className={styles.badge} data-active={active ? "true" : "false"}>
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}
