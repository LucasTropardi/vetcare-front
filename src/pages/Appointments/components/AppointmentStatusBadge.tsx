import type { AppointmentStatus } from "../../../services/api/types";
import { useNaming } from "../../../i18n/useNaming";
import styles from "./AppointmentStatusBadge.module.css";

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const naming = useNaming();
  const label =
    status === "OPEN"
      ? naming.getMessage("appointmentsStatusOpen")
      : status === "FINISHED"
        ? naming.getMessage("appointmentsStatusFinished")
        : naming.getMessage("appointmentsStatusCanceled");

  const className =
    status === "OPEN" ? styles.open : status === "FINISHED" ? styles.finished : styles.canceled;

  return <span className={`${styles.badge} ${className}`}>{label}</span>;
}
