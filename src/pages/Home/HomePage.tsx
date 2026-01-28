import { useNaming } from "../../i18n/useNaming";
import styles from "./HomePage.module.css";

export function HomePage() {
  const naming = useNaming();

  return (
    <div className={styles.page}>
      <h1>{naming.getTitle("home")}</h1>
      <p>{naming.getMessage("authenticated")}</p>
    </div>
  );
}
