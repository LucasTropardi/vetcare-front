import styles from "./Sidebar.module.css";
import { List, House, SignOut } from "@phosphor-icons/react";
import { useUiStore } from "../../store/ui.store";
import { useAuthStore } from "../../store/auth.store";
import { useNavigate } from "react-router-dom";

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);

  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  function logout() {
    clearAuth();
    navigate("/login", { replace: true });
  }

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.header}>
        <button className={styles.iconButton} onClick={toggle} aria-label="Toggle sidebar">
          <List size={18} />
        </button>
        {!collapsed && <div className={styles.title}>Menu</div>}
      </div>

      <nav className={styles.nav}>
        <a className={styles.item} href="/">
          <House size={18} />
          {!collapsed && <span>Home</span>}
        </a>
      </nav>

      <div className={styles.footer}>
        <button className={styles.itemButton} onClick={logout}>
          <SignOut size={18} />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
