import { useEffect, useMemo, useState } from "react";
import styles from "../pages/Users/components/UserFormModal.module.css";

import { useConfirmStore } from "../store/confirm.store";
import { updateMe } from "../services/api/users.service";
import { useAuthStore } from "../store/auth.store";
import { useNaming } from "../i18n/useNaming";
import { getApiErrorMessage } from "../services/api/errors";

type Props = {
  onClose: () => void;
  onSaved?: () => void;
};

type FormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export function MeFormModal({ onClose, onSaved }: Props) {
  const naming = useNaming();
  const confirm = useConfirmStore((s) => s.confirm);
  const me = useAuthStore((s) => s.me);
  const setMe = useAuthStore((s) => s.setMe);

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    setForm({
      name: me?.name ?? "",
      email: me?.email ?? "",
      password: "",
      confirmPassword: "",
    });
  }, [me]);

  const passwordMismatch = useMemo(() => {
    if (!form.password.trim() && !form.confirmPassword.trim()) return false;
    return form.password !== form.confirmPassword;
  }, [form.password, form.confirmPassword]);

  const canSubmit = useMemo(() => {
    if (!form.name.trim()) return false;
    if (!form.email.trim()) return false;
    if (passwordMismatch) return false;
    if (form.password.trim() && !form.confirmPassword.trim()) return false;
    return true;
  }, [form, passwordMismatch]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const ok = await confirm({
      title: naming.getMessage("saveChanges"),
      message: naming.getMessage("saveChangesProfileConfirm"),
      confirmText: naming.getLabel("confirm"),
      cancelText: naming.getLabel("cancel"),
      danger: false,
    });

    if (!ok) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim() || undefined,
        email: form.email.trim() || undefined,
        password: form.password.trim() ? form.password.trim() : undefined,
      };

      const updated = await updateMe(payload);
      setMe(updated);
      onSaved?.();
    } catch (error) {
      const apiMsg = getApiErrorMessage(error);
      console.log("Error saving profile:", error);
      await confirm({
        title: naming.getTitle("errorSavingUser"),
        message: apiMsg ?? (error instanceof Error ? error.message : naming.getMessage("unknown")),
        confirmText: naming.getLabel("ok"),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.title}>{naming.getTitle("editProfile")}</div>
        </div>

        {!me ? (
          <div className={styles.state}>{naming.getLabel("loading")}</div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} autoComplete="off">
            <div className={styles.grid}>
              <label className={styles.field}>
                <span>{naming.getLabel("name")}</span>
                <input
                  name="profile-name"
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  placeholder={naming.getPlaceholder("name")}
                />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("email")}</span>
                <input
                  name="profile-email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                  placeholder={naming.getPlaceholder("email")}
                />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("password")} {naming.getLabel("optional")}</span>
                <input
                  type="password"
                  name="profile-new-password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                  placeholder={naming.getMessage("leaveEmptyPasswordToKeep")}
                />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("confirmPassword")}</span>
                <input
                  type="password"
                  name="profile-confirm-password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((s) => ({ ...s, confirmPassword: e.target.value }))}
                  placeholder={naming.getPlaceholder("password")}
                />
              </label>
            </div>

            {passwordMismatch && (
              <div className={styles.error}>{naming.getMessage("passwordsDoNotMatch")}</div>
            )}

            <div className={styles.actions}>
              <button className={styles.btnGhost} type="button" onClick={onClose} disabled={saving}>
                {naming.getLabel("cancel")}
              </button>

              <button className={styles.btnPrimary} type="submit" disabled={!canSubmit || saving}>
                {saving ? naming.getLabel("saving") : naming.getLabel("save")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
