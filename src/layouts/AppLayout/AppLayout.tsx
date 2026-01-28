import { Outlet } from "react-router-dom";
import { Topbar } from "../../components/Topbar/Topbar";
import { Sidebar } from "../Sidebar/Sidebar"; 
import styles from "./AppLayout.module.css";
import { useEffect } from "react";
import { useUiStore } from "../../store/ui.store";
import { ConfirmModalHost } from "../../components/ConfirmModal/ConfirmModalHost";

export function AppLayout() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", collapsed ? "72px" : "280px");
  }, [collapsed]);
  
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <Topbar variant="app" />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
      <ConfirmModalHost />
    </div>
    
  );
}
