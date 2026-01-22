import styles from "./LoginPage.module.css";
import { useNaming } from "../../i18n/useNaming";

export function LoginPage() {
  const naming = useNaming();

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>{naming.getAuth("title")}</h1>
      <p className={styles.subtitle}>{naming.getAuth("subtitle")}</p>

      <div style={{ marginTop: 16, color: "var(--text-muted)" }}>
        Amanhã tem mais...
      </div>
    </div>
  );
}
