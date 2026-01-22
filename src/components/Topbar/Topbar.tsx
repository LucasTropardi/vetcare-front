import styles from "./Topbar.module.css";
import { Moon, Sun, Translate } from "@phosphor-icons/react";
import { useNaming } from "../../i18n/useNaming";
import { Naming, type Lang } from "../../i18n/naming";
import { useUiStore } from "../../store/ui.store"; 

type Props = {
  variant?: "minimal" | "app";
};

export function Topbar({ variant = "app" }: Props) {
  const naming = useNaming();
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <div className={styles.brand}>{naming.getApp("name")}</div>
      </div>

      <div className={styles.right}>
        <div className={styles.lang}>
          <Translate size={18} />
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
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {variant === "app" && (
          <div className={styles.userArea}>
            {/* Placeholder: depois entra avatar/nome/menú */}
            <div className={styles.userChip}>User</div>
          </div>
        )}
      </div>
    </header>
  );
}
