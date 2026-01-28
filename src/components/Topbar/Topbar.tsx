import styles from "./Topbar.module.css";
import { MoonIcon, SunIcon, TranslateIcon } from "@phosphor-icons/react";
import { useNaming } from "../../i18n/useNaming";
import { Naming, type Lang } from "../../i18n/naming";
import { useUiStore } from "../../store/ui.store"; 

type Props = {
  variant?: "minimal" | "app";
};

export function Topbar({ }: Props) {
  const naming = useNaming();
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <div className={styles.left}>
        <span className={styles.brandText}>Espaço 01</span>
      </div>

      </div>

      <div className={styles.right}>
        <div className={styles.lang}>
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
