import styles from "./ProductStatusBadge.module.css";
import { useNaming } from "../../../i18n/useNaming";

export function ProductStatusBadge({ active }: { active: boolean }) {
  const naming = useNaming();

  return (
    <span className={styles.badge} data-active={active ? "true" : "false"}>
      {active ? naming.getLabel("active") : naming.getLabel("inactive")}
    </span>
  );
}
