import { useEffect } from "react";
import styles from "../Stock/StockPlaceholderPage.module.css";
import { useNaming } from "../../i18n/useNaming";

export function ReportsPage() {
  const naming = useNaming();

  useEffect(() => {
    document.title = `${naming.t("sidebar.reports")} • ${naming.getApp("name")}`;
  }, [naming]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{naming.t("sidebar.reports")}</h1>
        <p className={styles.subtitle}>{naming.getMessage("moduleComingSoon")}</p>
      </div>
    </div>
  );
}
