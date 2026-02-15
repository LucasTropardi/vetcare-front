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
  PackageIcon,
  CaretDownIcon,
  CaretRightIcon,
  ClipboardTextIcon,
  ArrowsClockwiseIcon,
  PlusCircleIcon,
  MagnifyingGlassIcon,
  StethoscopeIcon,
  StorefrontIcon,
  CurrencyCircleDollarIcon,
  ChartBarIcon,
} from "@phosphor-icons/react";
import { useUiStore } from "../../store/ui.store";
import { useAuthStore } from "../../store/auth.store";
import { useNavigate, NavLink } from "react-router-dom";
import { BrandLogo } from "../../components/brand/BrandLogo";
import { useConfirmStore } from "../../store/confirm.store";
import { useNaming } from "../../i18n/useNaming";

const MOBILE_BREAKPOINT = 900;

type SidebarGroup = "registration" | "stock" | "operations" | "finance" | "reports";

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

  const [groupsOpen, setGroupsOpen] = useState<Record<SidebarGroup, boolean>>({
    registration: true,
    stock: true,
    operations: true,
    finance: true,
    reports: true,
  });

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const setMeModalOpen = useUiStore((s) => s.setMeModalOpen);

  const confirm = useConfirmStore((s) => s.confirm);

  const isAdmin = me?.role === "ADMIN";
  const vetPwaUrl = import.meta.env.VITE_VET_PWA_URL as string | undefined;
  const pdvPwaUrl = import.meta.env.VITE_PDV_PWA_URL as string | undefined;
  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.item} ${isActive ? styles.itemActive : ""}`;

  function closeSidebarOnMobile() {
    if (!isMobileNow()) return;
    setCollapsed(true);
    setUserMenuOpen(false);
  }

  function toggleGroup(group: SidebarGroup) {
    if (collapsed) return;
    setGroupsOpen((prev) => ({ ...prev, [group]: !prev[group] }));
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

      <div className={styles.menuArea}>
      <nav className={styles.nav}>
        <NavLink className={navItemClass} to="/" end onClick={closeSidebarOnMobile}>
          <HouseIcon size={18} />
          {!collapsed && <span>{naming.getTitle("home")}</span>}
        </NavLink>

        <div className={styles.group}>
          <button className={styles.groupTrigger} onClick={() => toggleGroup("registration")}>
            <ClipboardTextIcon size={18} />
            {!collapsed && <span>{naming.t("sidebar.registration")}</span>}
            {!collapsed && (groupsOpen.registration ? <CaretDownIcon size={14} /> : <CaretRightIcon size={14} />)}
          </button>
          {(collapsed || groupsOpen.registration) && (
            <div className={styles.submenu}>
              <NavLink className={navItemClass} to="/tutors" onClick={closeSidebarOnMobile}>
                <UsersThreeIcon size={18} />
                {!collapsed && <span>{naming.getTitle("tutors")}</span>}
              </NavLink>

              <NavLink className={navItemClass} to="/pets" onClick={closeSidebarOnMobile}>
                <PawPrintIcon size={18} />
                {!collapsed && <span>{naming.getTitle("pets")}</span>}
              </NavLink>

              <NavLink className={navItemClass} to="/customer-companies" onClick={closeSidebarOnMobile}>
                <BuildingsIcon size={18} />
                {!collapsed && <span>{naming.getTitle("customerCompanies")}</span>}
              </NavLink>

              <NavLink className={navItemClass} to="/products" onClick={closeSidebarOnMobile}>
                <PackageIcon size={18} />
                {!collapsed && <span>{naming.getTitle("products")}</span>}
              </NavLink>

              <NavLink className={navItemClass} to="/company-profile" onClick={closeSidebarOnMobile}>
                <BuildingsIcon size={18} />
                {!collapsed && <span>{naming.getTitle("companyProfile")}</span>}
              </NavLink>
            </div>
          )}
        </div>

        <div className={styles.group}>
          <button className={styles.groupTrigger} onClick={() => toggleGroup("stock")}>
            <ArrowsClockwiseIcon size={18} />
            {!collapsed && <span>{naming.t("sidebar.stock")}</span>}
            {!collapsed && (groupsOpen.stock ? <CaretDownIcon size={14} /> : <CaretRightIcon size={14} />)}
          </button>
          {(collapsed || groupsOpen.stock) && (
            <div className={styles.submenu}>
              <NavLink className={navItemClass} to="/stock/balances" onClick={closeSidebarOnMobile}>
                <PackageIcon size={18} />
                {!collapsed && <span>{naming.t("sidebar.stockBalances")}</span>}
              </NavLink>

              <NavLink className={navItemClass} to="/stock/movements" onClick={closeSidebarOnMobile}>
                <ArrowsClockwiseIcon size={18} />
                {!collapsed && <span>{naming.t("sidebar.stockMovements")}</span>}
              </NavLink>

              <NavLink className={navItemClass} to="/stock/new-movement" onClick={closeSidebarOnMobile}>
                <PlusCircleIcon size={18} />
                {!collapsed && <span>{naming.t("sidebar.stockNewMovement")}</span>}
              </NavLink>

              <NavLink className={navItemClass} to="/stock/product-view" onClick={closeSidebarOnMobile}>
                <MagnifyingGlassIcon size={18} />
                {!collapsed && <span>{naming.t("sidebar.stockProductDetail")}</span>}
              </NavLink>
            </div>
          )}
        </div>

        <div className={styles.group}>
          <button className={styles.groupTrigger} onClick={() => toggleGroup("operations")}>
            <StorefrontIcon size={18} />
            {!collapsed && <span>{naming.t("sidebar.operations")}</span>}
            {!collapsed && (groupsOpen.operations ? <CaretDownIcon size={14} /> : <CaretRightIcon size={14} />)}
          </button>
          {(collapsed || groupsOpen.operations) && (
            <div className={styles.submenu}>
              <a
                className={`${styles.item} ${!vetPwaUrl ? styles.itemDisabled : ""}`}
                href={vetPwaUrl || "#"}
                onClick={(e) => {
                  if (!vetPwaUrl) e.preventDefault();
                  closeSidebarOnMobile();
                }}
              >
                <StethoscopeIcon size={18} />
                {!collapsed && <span>{naming.t("sidebar.vetPwa")}</span>}
              </a>

              <a
                className={`${styles.item} ${!pdvPwaUrl ? styles.itemDisabled : ""}`}
                href={pdvPwaUrl || "#"}
                onClick={(e) => {
                  if (!pdvPwaUrl) e.preventDefault();
                  closeSidebarOnMobile();
                }}
              >
                <StorefrontIcon size={18} />
                {!collapsed && <span>{naming.t("sidebar.pdvPwa")}</span>}
              </a>
            </div>
          )}
        </div>

        <div className={styles.group}>
          <button className={styles.groupTrigger} onClick={() => toggleGroup("finance")}>
            <CurrencyCircleDollarIcon size={18} />
            {!collapsed && <span>{naming.t("sidebar.finance")}</span>}
            {!collapsed && (groupsOpen.finance ? <CaretDownIcon size={14} /> : <CaretRightIcon size={14} />)}
          </button>
          {(collapsed || groupsOpen.finance) && (
            <div className={styles.submenu}>
              <NavLink className={navItemClass} to="/finance" onClick={closeSidebarOnMobile}>
                <CurrencyCircleDollarIcon size={18} />
                {!collapsed && <span>{naming.t("sidebar.financeSalesTaxes")}</span>}
              </NavLink>
            </div>
          )}
        </div>

        <div className={styles.group}>
          <button className={styles.groupTrigger} onClick={() => toggleGroup("reports")}>
            <ChartBarIcon size={18} />
            {!collapsed && <span>{naming.t("sidebar.reports")}</span>}
            {!collapsed && (groupsOpen.reports ? <CaretDownIcon size={14} /> : <CaretRightIcon size={14} />)}
          </button>
          {(collapsed || groupsOpen.reports) && (
            <div className={styles.submenu}>
              <NavLink className={navItemClass} to="/reports" onClick={closeSidebarOnMobile}>
                <ChartBarIcon size={18} />
                {!collapsed && <span>{naming.t("sidebar.reportsCenter")}</span>}
              </NavLink>
            </div>
          )}
        </div>
      </nav>

      {isAdmin && (
        <nav className={styles.nav}>
          <NavLink className={navItemClass} to="/users" onClick={closeSidebarOnMobile}>
            <HouseIcon size={18} />
            {!collapsed && <span>{naming.getTitle("users")}</span>}
          </NavLink>
        </nav>
      )}
      </div>

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
