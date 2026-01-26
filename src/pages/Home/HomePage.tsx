import { useAuthStore } from "../../store/auth.store";
import { useNavigate } from "react-router-dom";
import { useNaming } from "../../i18n/useNaming";
import styles from "./HomePage.module.css";

export function HomePage() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const naming = useNaming();

  function goLogin() {
    clearAuth(); // força sair
    navigate("/login", { replace: true });
  }

  return (
    <div className={styles.page}>
      <h1>{naming.getTitle("home")}</h1>
      <p>{naming.getMessage("authenticated")}</p>

      <button className={styles.btn} onClick={goLogin}>
        (logout)
      </button>
    </div>
  );
}
