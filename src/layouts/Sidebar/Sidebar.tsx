import { useEffect, useRef, useState } from "react";
import styles from "./Sidebar.module.css";
import { HouseIcon, SignOutIcon, CaretUpDownIcon, UserCircleIcon } from "@phosphor-icons/react";
import { useUiStore } from "../../store/ui.store";
import { useAuthStore } from "../../store/auth.store";
import { useNavigate, Link } from "react-router-dom";
import { BrandLogo } from "../../components/brand/BrandLogo";
import { useConfirmStore } from "../../store/confirm.store";
import { useNaming } from "../../i18n/useNaming";

export function Sidebar() {
  const naming = useNaming();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);

  const me = useAuthStore((s) => s.me);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const confirm = useConfirmStore((s) => s.confirm);

  const isAdmin = me?.role === "ADMIN";

  async function handleLogout() {
    const ok = await confirm({
      title: naming.getLabel("sair"),
      message: naming.getMessage("encerrarSessaoConfirm"),
      confirmText: naming.getLabel("sair"),
      cancelText: naming.getLabel("cancel"),
      danger: true,
    });

    if (!ok) return;

    clearAuth();
    navigate("/login", { replace: true });
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setUserMenuOpen(false);
    }

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.header}>
        <button className={styles.iconButton} onClick={toggle} aria-label="Toggle sidebar">
          <BrandLogo height={32} />
        </button>
        {!collapsed && <div className={styles.title}>{naming.getTitle("menu")}</div>}
      </div>

      <nav className={styles.nav}>
        <Link className={styles.item} to="/">
          <HouseIcon size={18} />
          {!collapsed && <span>{naming.getTitle("home")}</span>}
        </Link>
      </nav>

      {isAdmin && (
        <nav className={styles.nav}>
          <Link className={styles.item} to="/users">
            <HouseIcon size={18} />
            {!collapsed && <span>{naming.getTitle("users")}</span>}
          </Link>
        </nav>
      )}

      <div className={styles.footer}>
        {/* USER MENU */}
        <div className={styles.userMenu} ref={userMenuRef}>
          <button
            className={styles.userTrigger}
            onClick={() => setUserMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            title={me?.email ?? naming.getTitle("user")}
          >
            <UserCircleIcon size={32} />
            {!collapsed && (
              <>
                <div className={styles.userTriggerText}>
                  <div className={styles.userName}>{me?.name ?? naming.getTitle("user")}</div>
                  <div className={styles.userEmail}>{me?.email ?? naming.getMessage("emailNotAvailable")}</div>
                </div>
                <CaretUpDownIcon size={16} />
              </>
            )}
          </button>

          {userMenuOpen && !collapsed && (
            <div className={styles.userDropdown} role="menu">
              <div className={styles.userMeta}>
                <div className={styles.userMetaName}>{me?.name ?? naming.getTitle("user")}</div>
                <div className={styles.userMetaEmail}>{me?.email ?? "Email não disponível"}</div>
                <div className={styles.userMetaRole}>{me?.role ?? "USER"}</div>
              </div>

              <div className={styles.dropdownDivider} />

              {/* adicionar "Editar perfil" aqui */}
              <button className={styles.dropdownItem} onClick={handleLogout} role="menuitem">
                <SignOutIcon size={18} />
                <span>{naming.getLabel("sair")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
