import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./TutorFormModal.module.css";

import { useConfirmStore } from "../../../store/confirm.store";
import type { CreateTutorRequest, TutorAddressRequest, TutorResponse, UpdateTutorRequest } from "../../../services/api/types";
import { createTutor, getTutorById, updateTutor } from "../../../services/api/tutors.service";
import { useNaming } from "../../../i18n/useNaming";
import { getApiErrorMessage } from "../../../services/api/errors";
import { getAddressByCep } from "../../../services/api/viacep.service";
import { validateCpf } from "../../../utils/documentValidation";

type Props = {
  tutorId?: number;
  onClose: () => void;
  onSaved: () => void;
};

type AddressState = {
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  cityName: string;
  cityIbge: string;
  stateUf: string;
  country: string;
};

type FormState = {
  name: string;
  document: string;
  phone: string;
  email: string;
  address: AddressState;
};

const EMPTY_ADDRESS: AddressState = {
  zipCode: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  cityName: "",
  cityIbge: "",
  stateUf: "",
  country: "",
};

function trimOrUndefined(value: string) {
  const v = value.trim();
  return v ? v : undefined;
}

function onlyDigits(value: string) {
  return value.replace(/\D+/g, "");
}

function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (!digits) return "";

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);

  if (rest.length <= 4) {
    return `(${ddd}) ${rest}`;
  }

  if (rest.length <= 8) {
    const p1 = rest.slice(0, 4);
    const p2 = rest.slice(4);
    return `(${ddd}) ${p1}${p2 ? `-${p2}` : ""}`;
  }

  const p1 = rest.slice(0, 5);
  const p2 = rest.slice(5, 9);
  return `(${ddd}) ${p1}${p2 ? `-${p2}` : ""}`;
}

function formatZipCode(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  if (!digits) return "";
  const p1 = digits.slice(0, 2);
  const p2 = digits.slice(2, 5);
  const p3 = digits.slice(5, 8);
  if (digits.length <= 2) return p1;
  if (digits.length <= 5) return `${p1}.${p2}`;
  return `${p1}.${p2}-${p3}`;
}

function formatCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (!digits) return "";
  const p1 = digits.slice(0, 3);
  const p2 = digits.slice(3, 6);
  const p3 = digits.slice(6, 9);
  const p4 = digits.slice(9, 11);
  if (digits.length <= 3) return p1;
  if (digits.length <= 6) return `${p1}.${p2}`;
  if (digits.length <= 9) return `${p1}.${p2}.${p3}`;
  return `${p1}.${p2}.${p3}-${p4}`;
}

function buildAddress(address: AddressState): TutorAddressRequest | undefined {
  const payload: TutorAddressRequest = {
    zipCode: trimOrUndefined(onlyDigits(address.zipCode)),
    street: trimOrUndefined(address.street),
    number: trimOrUndefined(address.number),
    complement: trimOrUndefined(address.complement),
    neighborhood: trimOrUndefined(address.neighborhood),
    cityName: trimOrUndefined(address.cityName),
    cityIbge: trimOrUndefined(address.cityIbge),
    stateUf: trimOrUndefined(address.stateUf),
    country: trimOrUndefined(address.country),
  };

  const hasAny = Object.values(payload).some((v) => !!v);
  return hasAny ? payload : undefined;
}

function toAddressState(t?: TutorResponse["address"] | null): AddressState {
  return {
    zipCode: t?.zipCode ?? "",
    street: t?.street ?? "",
    number: t?.number ?? "",
    complement: t?.complement ?? "",
    neighborhood: t?.neighborhood ?? "",
    cityName: t?.cityName ?? "",
    cityIbge: t?.cityIbge ?? "",
    stateUf: t?.stateUf ?? "",
    country: t?.country ?? "",
  };
}

export function TutorFormModal({ tutorId, onClose, onSaved }: Props) {
  const naming = useNaming();
  const isEdit = typeof tutorId === "number";
  const confirm = useConfirmStore((s) => s.confirm);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const lastCepLookup = useRef<string | null>(null);

  const [form, setForm] = useState<FormState>({
    name: "",
    document: "",
    phone: "",
    email: "",
    address: { ...EMPTY_ADDRESS },
  });

  const cpfInvalid = useMemo(() => {
    const digits = onlyDigits(form.document);
    if (!digits) return false;
    return !validateCpf(digits);
  }, [form.document]);

  const canSubmit = useMemo(() => {
    if (!form.name.trim()) return false;
    if (cpfInvalid) return false;
    return true;
  }, [form.name, cpfInvalid]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!isEdit) return;

      setLoading(true);
      try {
        const t = await getTutorById(tutorId!);
        if (!mounted) return;

        setForm({
          name: t.name ?? "",
          document: formatCpf(t.document ?? ""),
          phone: formatPhone(t.phone ?? ""),
          email: t.email ?? "",
          address: {
            ...toAddressState(t.address),
            zipCode: formatZipCode(t.address?.zipCode ?? ""),
          },
        });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [isEdit, tutorId]);

  async function handleCepBlur() {
    const digits = onlyDigits(form.address.zipCode);
    if (digits.length !== 8) return;
    if (lastCepLookup.current === digits) return;

    setCepLoading(true);
    try {
      const data = await getAddressByCep(digits);
      if (data.erro) {
        await confirm({
          title: naming.getTitle("tutor"),
          message: naming.getMessage("cepNotFound"),
          confirmText: naming.getLabel("ok"),
        });
        return;
      }

      setForm((s) => ({
        ...s,
        address: {
          ...s.address,
          street: s.address.street.trim() ? s.address.street : data.logradouro ?? s.address.street,
          neighborhood: s.address.neighborhood.trim() ? s.address.neighborhood : data.bairro ?? s.address.neighborhood,
          cityName: s.address.cityName.trim() ? s.address.cityName : data.localidade ?? s.address.cityName,
          stateUf: s.address.stateUf.trim() ? s.address.stateUf : data.uf ?? s.address.stateUf,
          cityIbge: s.address.cityIbge.trim() ? s.address.cityIbge : data.ibge ?? s.address.cityIbge,
          country: s.address.country.trim() ? s.address.country : "BR",
        },
      }));

      lastCepLookup.current = digits;
    } catch (error) {
      const apiMsg = getApiErrorMessage(error);
      console.log("Error fetching CEP:", error);
      await confirm({
        title: naming.getTitle("tutor"),
        message: apiMsg ?? naming.getMessage("cepLookupError"),
        confirmText: naming.getLabel("ok"),
      });
    } finally {
      setCepLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const ok = await confirm({
      title: isEdit ? naming.getMessage("saveChanges") : naming.getMessage("createTutor"),
      message: isEdit ? naming.getMessage("saveChangesTutorConfirm") : naming.getMessage("createTutorConfirm"),
      confirmText: naming.getLabel("confirm"),
      cancelText: naming.getLabel("cancel"),
      danger: false,
    });

    if (!ok) return;

    setSaving(true);
    try {
      const addressPayload = buildAddress(form.address);

      if (isEdit) {
        const payload: UpdateTutorRequest = {
          name: form.name.trim(),
          document: trimOrUndefined(onlyDigits(form.document)),
          phone: trimOrUndefined(form.phone),
          email: trimOrUndefined(form.email),
          address: addressPayload,
        };

        await updateTutor(tutorId!, payload);
      } else {
        const payload: CreateTutorRequest = {
          name: form.name.trim(),
          document: trimOrUndefined(onlyDigits(form.document)),
          phone: trimOrUndefined(form.phone),
          email: trimOrUndefined(form.email),
          address: addressPayload,
        };

        await createTutor(payload);
      }

      onSaved();
    } catch (error) {
      const apiMsg = getApiErrorMessage(error);
      console.log("Error saving tutor:", error);
      await confirm({
        title: naming.getTitle("errorSavingTutor"),
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
          <div className={styles.title}>{isEdit ? naming.getTitle("editTutor") : naming.getTitle("newTutor")}</div>
        </div>

        {loading ? (
          <div className={styles.state}>{naming.getLabel("loading")}</div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span>{naming.getLabel("name")}</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  placeholder={naming.getPlaceholder("tutorName")}
                />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("document")}</span>
                <input
                  value={form.document}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, document: formatCpf(e.target.value) }))
                  }
                  placeholder={naming.getPlaceholder("document")}
                  aria-invalid={cpfInvalid}
                />
                {cpfInvalid && <div className={styles.error}>{naming.getMessage("invalidCpf")}</div>}
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("phone")}</span>
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, phone: formatPhone(e.target.value) }))
                  }
                  placeholder={naming.getPlaceholder("phone")}
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
                <span>
                  {naming.getLabel("zipCode")}
                  {cepLoading ? ` ${naming.getLabel("loading")}` : ""}
                </span>
                <input
                  value={form.address.zipCode}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      address: { ...s.address, zipCode: formatZipCode(e.target.value) },
                    }))
                  }
                  onBlur={handleCepBlur}
                  placeholder={naming.getPlaceholder("zipCode")}
                />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("street")}</span>
                <input
                  value={form.address.street}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, address: { ...s.address, street: e.target.value } }))
                  }
                  placeholder={naming.getPlaceholder("street")}
                />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("number")}</span>
                <input
                  value={form.address.number}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, address: { ...s.address, number: e.target.value } }))
                  }
                  placeholder={naming.getPlaceholder("number")}
                />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("complement")}</span>
                <input
                  value={form.address.complement}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, address: { ...s.address, complement: e.target.value } }))
                  }
                  placeholder={naming.getPlaceholder("complement")}
                />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("neighborhood")}</span>
                <input
                  value={form.address.neighborhood}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, address: { ...s.address, neighborhood: e.target.value } }))
                  }
                  placeholder={naming.getPlaceholder("neighborhood")}
                />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("cityName")}</span>
                <input
                  value={form.address.cityName}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, address: { ...s.address, cityName: e.target.value } }))
                  }
                  placeholder={naming.getPlaceholder("cityName")}
                />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("cityIbge")}</span>
                <input
                  value={form.address.cityIbge}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, address: { ...s.address, cityIbge: e.target.value } }))
                  }
                  placeholder={naming.getPlaceholder("cityIbge")}
                />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("stateUf")}</span>
                <input
                  value={form.address.stateUf}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, address: { ...s.address, stateUf: e.target.value } }))
                  }
                  placeholder={naming.getPlaceholder("stateUf")}
                />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("country")}</span>
                <input
                  value={form.address.country}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, address: { ...s.address, country: e.target.value } }))
                  }
                  placeholder={naming.getPlaceholder("country")}
                />
              </label>
            </div>

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
