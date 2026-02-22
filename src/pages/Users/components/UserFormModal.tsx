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
  professionalLicense: string;
  signatureImageBase64: string;
  signatureImageContentType: string;
};

const DEFAULT_ROLE: Role = "RECEPTION";

function dataUrlToParts(dataUrl: string) {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return { mime: "image/png", base64: dataUrl };
  const meta = dataUrl.slice(0, comma);
  const base64 = dataUrl.slice(comma + 1);
  const mime = meta.replace("data:", "").replace(";base64", "") || "image/png";
  return { mime, base64 };
}

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
    professionalLicense: "",
    signatureImageBase64: "",
    signatureImageContentType: "image/png",
  });

  const [signaturePreview, setSignaturePreview] = useState<string>("");

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
          professionalLicense: u.professionalLicense ?? "",
          signatureImageBase64: u.signatureImageBase64 ?? "",
          signatureImageContentType: u.signatureImageContentType ?? "image/png",
        });
        if (u.signatureImageBase64) {
          setSignaturePreview(`data:${u.signatureImageContentType ?? "image/png"};base64,${u.signatureImageBase64}`);
        }
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

  async function handleSignatureChange(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      await confirm({ title: "Assinatura", message: "Selecione um arquivo de imagem.", confirmText: naming.getLabel("ok") });
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Falha ao ler imagem"));
      reader.readAsDataURL(file);
    });

    const { mime, base64 } = dataUrlToParts(dataUrl);
    setForm((s) => ({ ...s, signatureImageBase64: base64, signatureImageContentType: mime }));
    setSignaturePreview(dataUrl);
  }

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
          professionalLicense: form.role === "VET" ? form.professionalLicense.trim() || undefined : undefined,
          signatureImageBase64: form.role === "VET" ? (form.signatureImageBase64 || "") : "",
          signatureImageContentType: form.role === "VET" ? form.signatureImageContentType || "image/png" : "image/png",
        };

        await updateUser(userId!, payload);
      } else {
        const payload: CreateUserRequest = {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password.trim(),
          confirmPassword: form.confirmPassword.trim(),
          role: form.role,
          professionalLicense: form.role === "VET" ? form.professionalLicense.trim() || undefined : undefined,
          signatureImageBase64: form.role === "VET" ? form.signatureImageBase64 || undefined : undefined,
          signatureImageContentType: form.role === "VET" ? form.signatureImageContentType || "image/png" : undefined,
        };

        await createUser(payload);
      }

      onSaved();
    } catch (error) {
      const apiMsg = getApiErrorMessage(error);
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
          <div className={styles.state}>{naming.getMessage("noPermissionEditUser")}</div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span>{naming.getLabel("name")}</span>
                <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder={naming.getPlaceholder("name")} />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("email")}</span>
                <input value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} placeholder={naming.getPlaceholder("email")} />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("password")} {isEdit ? naming.getLabel("optional") : ""}</span>
                <input type="password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} placeholder={isEdit ? naming.getMessage("leaveEmptyPasswordToKeep") : naming.getPlaceholder("password")} />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("confirmPassword")} {isEdit ? naming.getLabel("optional") : ""}</span>
                <input type="password" value={form.confirmPassword} onChange={(e) => setForm((s) => ({ ...s, confirmPassword: e.target.value }))} placeholder={naming.getPlaceholder("password")} />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("role")}</span>
                <select value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value as Role }))}>
                  <option value="ADMIN">{naming.getRole("ADMIN")}</option>
                  <option value="VET">{naming.getRole("VET")}</option>
                  <option value="RECEPTION">{naming.getRole("RECEPTION")}</option>
                </select>
              </label>

              {isEdit && (
                <label className={styles.switchRow}>
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))} />
                  <span>{form.active ? naming.getLabel("activeUser") : naming.getLabel("inactiveUser")}</span>
                </label>
              )}

              {form.role === "VET" && (
                <>
                  <label className={styles.field}>
                    <span>Registro profissional (CRMV)</span>
                    <input
                      value={form.professionalLicense}
                      onChange={(e) => setForm((s) => ({ ...s, professionalLicense: e.target.value }))}
                      placeholder="Ex.: CRMV-SP 12345"
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Assinatura (imagem)</span>
                    <input type="file" accept="image/*" onChange={(e) => void handleSignatureChange(e.target.files?.[0])} />
                  </label>

                  {signaturePreview && (
                    <div className={styles.signaturePreviewWrap}>
                      <img className={styles.signaturePreview} src={signaturePreview} alt="Assinatura do veterinário" />
                      <button
                        type="button"
                        className={styles.btnGhost}
                        onClick={() => {
                          setSignaturePreview("");
                          setForm((s) => ({ ...s, signatureImageBase64: "", signatureImageContentType: "image/png" }));
                        }}
                      >
                        Remover assinatura
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {passwordMismatch && <div className={styles.error}>{naming.getMessage("passwordsDoNotMatch")}</div>}

            <div className={styles.actions}>
              <button className={styles.btnGhost} type="button" onClick={onClose} disabled={saving}>{naming.getLabel("cancel")}</button>
              <button className={styles.btnPrimary} type="submit" disabled={!canSubmit || saving}>{saving ? naming.getLabel("saving") : naming.getLabel("save")}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
