import styles from "./Topbar.module.css";
import { MoonIcon, SunIcon, TranslateIcon } from "@phosphor-icons/react";
import { useNaming } from "../../i18n/useNaming";
import { Naming, type Lang } from "../../i18n/naming";
import { useUiStore } from "../../store/ui.store"; 
import { useAuthStore } from "../../store/auth.store";
import { useNavigate } from "react-router-dom";

type Props = {
  variant?: "minimal" | "app";
};

export function Topbar({ }: Props) {
  const naming = useNaming();
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  function logout() {
    clearAuth();
    navigate("/login", { replace: true });
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <div className={styles.left}>
        <span className={styles.brandText}>Espaço 01</span>
      </div>

      </div>

      <div className={styles.right}>
        <div className={styles.lang}>
          <TranslateIcon size={18} />
          <select
            className={styles.select}
            value={naming.getLang()}
            onChange={(e) => Naming.setLang(e.target.value as Lang)}
            aria-label="Language"
          >
            <option value="pt">PT</option>
            <option value="en">EN</option>
            <option value="es">ES</option>
          </select>
        </div>

        <button className={styles.iconButton} onClick={toggleTheme} aria-label="Theme">
          {theme === "light" ? <MoonIcon size={18} /> : <SunIcon size={18} />}
        </button>
      </div>
    </header>
  );
}
