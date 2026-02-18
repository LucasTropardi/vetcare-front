import type { AppointmentType } from "../../../services/api/types";
import { useNaming } from "../../../i18n/useNaming";
import styles from "./AppointmentTypeBadge.module.css";

export function AppointmentTypeBadge({ type }: { type: AppointmentType }) {
  const naming = useNaming();
  const label = type === "VET" ? naming.getMessage("appointmentsTypeVet") : naming.getMessage("appointmentsTypePetshop");
  return <span className={`${styles.badge} ${type === "VET" ? styles.vet : styles.petshop}`}>{label}</span>;
}
