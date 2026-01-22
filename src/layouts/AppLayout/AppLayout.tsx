import { Outlet } from "react-router-dom";
import { Topbar } from "../../components/Topbar/Topbar";
import styles from "./AppLayout.module.css";

export function AppLayout() {
  const isAuthenticated = false; // depois Zustand authStore

  return (
    <div className={styles.shell}>
      {/* Sidebar entra só quando autenticado */}
      {isAuthenticated && <aside className={styles.sidebar}>Sidebar</aside>}

      <div className={styles.main}>
        <Topbar variant="app" />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
