import { useEffect } from "react";
import styles from "./StockPlaceholderPage.module.css";
import { useNaming } from "../../i18n/useNaming";

export function StockNewMovementPage() {
  const naming = useNaming();

  useEffect(() => {
    document.title = `${naming.t("sidebar.stockNewMovement")} • ${naming.getApp("name")}`;
  }, [naming]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{naming.t("sidebar.stockNewMovement")}</h1>
        <p className={styles.subtitle}>{naming.getMessage("stockModuleComingSoon")}</p>
      </div>
    </div>
  );
}
