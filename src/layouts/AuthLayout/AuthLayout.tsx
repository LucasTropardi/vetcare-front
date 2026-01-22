import { Outlet } from "react-router-dom";
import { Topbar } from "../../components/Topbar/Topbar";
import styles from "./AuthLayout.module.css";

export function AuthLayout() {
  return (
    <div className={styles.page}>
      <Topbar variant="minimal" />
      <main className={styles.main}>
        <div className={styles.container}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
