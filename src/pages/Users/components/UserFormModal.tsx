import { useEffect, useMemo, useState } from "react";
import styles from "./UserFormModal.module.css";

import { useConfirmStore } from "../../../store/confirm.store";
import type { CreateUserRequest, Role, UpdateUserRequest, UserResponseWithRole } from "../../../services/api/types";
import { createUser, getUserById, updateUser } from "../../../services/api/users.service";
import { useNaming } from "../../../i18n/useNaming"; 
import { getApiErrorMessage } from "../../../services/api/errors";

type Props = {
  userId?: number;
  onClose: () => void;
  onSaved: () => void;
  currentRole?: Role;
  canEditTarget: (current?: Role, target?: Role) => boolean;
};

type FormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
  active: boolean;
};

const DEFAULT_ROLE: Role = "RECEPTION";

export function UserFormModal({ userId, onClose, onSaved, currentRole, canEditTarget }: Props) {
  const naming = useNaming();
  const isEdit = typeof userId === "number";
  const confirm = useConfirmStore((s) => s.confirm);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadedUser, setLoadedUser] = useState<UserResponseWithRole | null>(null);

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: DEFAULT_ROLE,
    active: true,
  });

  const passwordMismatch = useMemo(() => {
    if (!form.password.trim() && !form.confirmPassword.trim()) return false;
    return form.password !== form.confirmPassword;
  }, [form.password, form.confirmPassword]);

  const canSubmit = useMemo(() => {
    if (!form.name.trim()) return false;
    if (!form.email.trim()) return false;
    if (!isEdit && !form.password.trim()) return false;
    if (isEdit && form.password.trim() && !form.confirmPassword.trim()) return false;
    if (passwordMismatch) return false;
    return true;
  }, [form, isEdit, passwordMismatch]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!isEdit) return;

      setLoading(true);
      try {
        const u = await getUserById(userId!);
        if (!mounted) return;

        setLoadedUser(u);
        setForm({
          name: u.name ?? "",
          email: u.email ?? "",
          password: "",
          confirmPassword: "",
          role: u.role,
          active: !!u.active,
        });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [isEdit, userId]);

  const targetRole = loadedUser?.role;
  const allowedToEditTarget = isEdit ? canEditTarget(currentRole, targetRole) : true;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!allowedToEditTarget) return;

    const ok = await confirm({
      title: isEdit ? naming.getMessage("saveChanges") : naming.getMessage("createUser"),
      message: isEdit ? naming.getMessage("saveChangesUserConfirm") : naming.getMessage("createUserConfirm"),
      confirmText: naming.getLabel("confirm"),
      cancelText: naming.getLabel("cancel"),
      danger: false,
    });

    if (!ok) return;

    setSaving(true);
    try {
      if (isEdit) {
        const payload: UpdateUserRequest = {
          name: form.name.trim() || undefined,
          email: form.email.trim() || undefined,
          role: form.role,
          active: form.active,
          password: form.password.trim() ? form.password.trim() : undefined,
          confirmPassword: form.password.trim() ? form.confirmPassword.trim() : undefined,
        };

        await updateUser(userId!, payload);
      } else {
        const payload: CreateUserRequest = {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password.trim(),
          confirmPassword: form.confirmPassword.trim(),
          role: form.role,
        };

        await createUser(payload);
      }

      onSaved();
    } catch (error) {
      const apiMsg = getApiErrorMessage(error);
      console.log("Error saving user:", error);
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
          <div className={styles.title}>{isEdit ? naming.getTitle("editUser") : naming.getTitle("newUser")}</div>
        </div>

        {loading ? (
          <div className={styles.state}>{naming.getLabel("loading")}</div>
        ) : !allowedToEditTarget ? (
          <div className={styles.state}>
            {naming.getMessage("noPermissionEditUser")}
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span>{naming.getLabel("name")}</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  placeholder={naming.getPlaceholder("name")}
                />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("email")}</span>
                <input
                  value={form.email}
                  onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                  placeholder={naming.getPlaceholder("email")}
                />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("password")} {isEdit ? naming.getLabel("optional") : ""}</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                  placeholder={isEdit ? naming.getMessage("leaveEmptyPasswordToKeep") : naming.getPlaceholder("password")}
                />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("confirmPassword")} {isEdit ? naming.getLabel("optional") : ""}</span>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((s) => ({ ...s, confirmPassword: e.target.value }))}
                  placeholder={naming.getPlaceholder("password")}
                />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("role")}</span>
                <select
                  value={form.role}
                  onChange={(e) => setForm((s) => ({ ...s, role: e.target.value as Role }))}
                >
                  <option value="ADMIN">{naming.getRole("ADMIN")}</option>
                  <option value="VET">{naming.getRole("VET")}</option>
                  <option value="RECEPTION">{naming.getRole("RECEPTION")}</option>
                </select>
              </label>

              {isEdit && (
                <label className={styles.switchRow}>
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))}
                  />
                  <span>{form.active ? naming.getLabel("activeUser") : naming.getLabel("inactiveUser")}</span>
                </label>
              )}
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
