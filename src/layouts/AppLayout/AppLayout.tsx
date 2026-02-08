import { Outlet } from "react-router-dom";
import { Topbar } from "../../components/Topbar/Topbar";
import { Sidebar } from "../Sidebar/Sidebar"; 
import styles from "./AppLayout.module.css";
import { useEffect } from "react";
import { useUiStore } from "../../store/ui.store";
import { ConfirmModalHost } from "../../components/ConfirmModal/ConfirmModalHost";
import { MeFormModal } from "../../components/MeFormModal";

export function AppLayout() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const setCollapsed = useUiStore((s) => s.setSidebarCollapsed);
  const meModalOpen = useUiStore((s) => s.meModalOpen);
  const setMeModalOpen = useUiStore((s) => s.setMeModalOpen);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 900px)");

    const apply = () => {
      if (mql.matches) setCollapsed(true);
    };

    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, [setCollapsed]);

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
      {meModalOpen && (
        <MeFormModal
          onClose={() => setMeModalOpen(false)}
          onSaved={() => setMeModalOpen(false)}
        />
      )}
      <ConfirmModalHost />
    </div>
  );
}
