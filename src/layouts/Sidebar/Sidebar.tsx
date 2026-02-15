import { useEffect, useRef, useState } from "react";
import styles from "./Sidebar.module.css";
import {
  HouseIcon,
  SignOutIcon,
  CaretUpDownIcon,
  UserCircleIcon,
  UsersThreeIcon,
  PawPrintIcon,
  BuildingsIcon,
} from "@phosphor-icons/react";
import { useUiStore } from "../../store/ui.store";
import { useAuthStore } from "../../store/auth.store";
import { useNavigate, Link } from "react-router-dom";
import { BrandLogo } from "../../components/brand/BrandLogo";
import { useConfirmStore } from "../../store/confirm.store";
import { useNaming } from "../../i18n/useNaming";

const MOBILE_BREAKPOINT = 900;

function isMobileNow() {
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
}

export function Sidebar() {
  const naming = useNaming();

  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);
  const setCollapsed = useUiStore((s) => s.setSidebarCollapsed);

  const me = useAuthStore((s) => s.me);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const setMeModalOpen = useUiStore((s) => s.setMeModalOpen);

  const confirm = useConfirmStore((s) => s.confirm);

  const isAdmin = me?.role === "ADMIN";

  function closeSidebarOnMobile() {
    if (!isMobileNow()) return;
    setCollapsed(true);
    setUserMenuOpen(false);
  }

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
      if (e.key === "Escape") {
        setUserMenuOpen(false);

        if (isMobileNow() && !collapsed) setCollapsed(true);
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [collapsed, setCollapsed]);

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.header}>
        <button className={styles.iconButton} onClick={toggle} aria-label="Toggle sidebar">
          <BrandLogo height={32} />
        </button>
        {!collapsed && <div className={styles.title}>{naming.getTitle("menu")}</div>}
      </div>

      <nav className={styles.nav}>
        <Link className={styles.item} to="/" onClick={closeSidebarOnMobile}>
          <HouseIcon size={18} />
          {!collapsed && <span>{naming.getTitle("home")}</span>}
        </Link>

        <Link className={styles.item} to="/tutors" onClick={closeSidebarOnMobile}>
          <UsersThreeIcon size={18} />
          {!collapsed && <span>{naming.getTitle("tutors")}</span>}
        </Link>

        <Link className={styles.item} to="/pets" onClick={closeSidebarOnMobile}>
          <PawPrintIcon size={18} />
          {!collapsed && <span>{naming.getTitle("pets")}</span>}
        </Link>

        <Link className={styles.item} to="/customer-companies" onClick={closeSidebarOnMobile}>
          <BuildingsIcon size={18} />
          {!collapsed && <span>{naming.getTitle("customerCompanies")}</span>}
        </Link>

        <Link className={styles.item} to="/company-profile" onClick={closeSidebarOnMobile}>
          <BuildingsIcon size={18} />
          {!collapsed && <span>{naming.getTitle("companyProfile")}</span>}
        </Link>
      </nav>

      {isAdmin && (
        <nav className={styles.nav}>
          <Link className={styles.item} to="/users" onClick={closeSidebarOnMobile}>
            <HouseIcon size={18} />
            {!collapsed && <span>{naming.getTitle("users")}</span>}
          </Link>
        </nav>
      )}

      <div className={styles.footer}>
        <div className={styles.userMenu} ref={userMenuRef}>
          <button
            className={styles.userTrigger}
            onClick={collapsed ? toggle : () => setUserMenuOpen((v) => !v)}
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

              <button
                className={styles.dropdownItem}
                onClick={() => {
                  setUserMenuOpen(false);
                  setMeModalOpen(true);
                }}
                role="menuitem"
              >
                <UserCircleIcon size={18} />
                <span>{naming.getLabel("editProfile")}</span>
              </button>

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
