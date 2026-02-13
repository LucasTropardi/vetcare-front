import styles from "./PetStatusBadge.module.css";
import { useNaming } from "../../../i18n/useNaming";

export function PetStatusBadge({ active }: { active: boolean }) {
  const naming = useNaming();
  return (
    <span className={styles.badge} data-active={active ? "true" : "false"}>
      {active ? naming.getLabel("petInFollowUp") : naming.getLabel("petInactive")}
    </span>
  );
}
