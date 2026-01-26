import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { BrandLogo } from "../../components/brand/BrandLogo";
import styles from "./LoginPage.module.css";
import { useNaming } from "../../i18n/useNaming";
import { login } from "../../services/api/auth.service";
import { useAuthStore } from "../../store/auth.store";

type FormValues = {
  email: string;
  password: string;
};

export function LoginPage() {
  const naming = useNaming();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const schema = useMemo(() => {
    return z.object({
      email: z.string().min(1, "required").email("invalidEmail"),
      password: z.string().min(1, "required"),
    });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setLoading(true);
    console.log("Submitting", values);
    try {
      const res = await login(values);
      setAuth(res.accessToken, res.tokenType);
      navigate("/", { replace: true });
    } catch (err: any) {
      setServerError(naming.getMessage("invalidCredentials"));
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className={styles.card}>
      <div className={styles.brandArea}>
        <BrandLogo height={104} />
      </div>
      <h1 className={styles.title}>{naming.getAuth("title")}</h1>
      {/* <p className={styles.subtitle}>{naming.getAuth("subtitle")}</p> */}

      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>{naming.getField("email")}</label>
          <input
            className={styles.input}
            type="email"
            autoComplete="email"
            {...register("email")}
          />
            {errors.email && (
              <div className={styles.error}>
                {naming.getMessage("invalidCredentials")}
              </div>
            )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{naming.getField("password")}</label>
          <input
            className={styles.input}
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && <div className={styles.error}>{naming.getMessage("invalidCredentials")}</div>}
        </div>

        {serverError && <div className={styles.serverError}>{serverError}</div>}

        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? naming.getMessage("loading") : naming.getAuth("login")}
        </button>
      </form>
    </div>
  );
}
