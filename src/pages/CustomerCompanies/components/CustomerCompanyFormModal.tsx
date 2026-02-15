import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./CustomerCompanyFormModal.module.css";

import { useConfirmStore } from "../../../store/confirm.store";
import type {
  CreateCustomerCompanyRequest,
  CustomerCompanyAddressRequest,
  CustomerCompanyResponse,
  IeIndicator,
  TutorListItemResponse,
  UpdateCustomerCompanyRequest,
} from "../../../services/api/types";
import { IE_INDICATOR_OPTIONS } from "../../../services/api/types";
import {
  createCustomerCompany,
  getCustomerCompanyById,
  updateCustomerCompany,
} from "../../../services/api/customer-companies.service";
import { listTutors } from "../../../services/api/tutors.service";
import { useNaming } from "../../../i18n/useNaming";
import { getApiErrorMessage } from "../../../services/api/errors";
import { getAddressByCep } from "../../../services/api/viacep.service";
import { validateCnpj } from "../../../utils/documentValidation";

type Props = {
  companyId?: number;
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
  tutorId: string;
  legalName: string;
  tradeName: string;
  cnpj: string;
  phone: string;
  email: string;
  ie: string;
  ieIndicator: IeIndicator;
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
  country: "BR",
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

function formatCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);
  if (!digits) return "";
  const p1 = digits.slice(0, 2);
  const p2 = digits.slice(2, 5);
  const p3 = digits.slice(5, 8);
  const p4 = digits.slice(8, 12);
  const p5 = digits.slice(12, 14);
  if (digits.length <= 2) return p1;
  if (digits.length <= 5) return `${p1}.${p2}`;
  if (digits.length <= 8) return `${p1}.${p2}.${p3}`;
  if (digits.length <= 12) return `${p1}.${p2}.${p3}/${p4}`;
  return `${p1}.${p2}.${p3}/${p4}-${p5}`;
}

function toAddressState(address?: CustomerCompanyResponse["address"] | null): AddressState {
  return {
    zipCode: address?.zipCode ?? "",
    street: address?.street ?? "",
    number: address?.number ?? "",
    complement: address?.complement ?? "",
    neighborhood: address?.neighborhood ?? "",
    cityName: address?.cityName ?? "",
    cityIbge: address?.cityIbge ?? "",
    stateUf: address?.stateUf ?? "",
    country: address?.country ?? "BR",
  };
}

function buildAddress(address: AddressState): CustomerCompanyAddressRequest | undefined {
  const payload: CustomerCompanyAddressRequest = {
    zipCode: trimOrUndefined(onlyDigits(address.zipCode)),
    street: trimOrUndefined(address.street),
    number: trimOrUndefined(address.number),
    complement: trimOrUndefined(address.complement),
    neighborhood: trimOrUndefined(address.neighborhood),
    cityName: trimOrUndefined(address.cityName),
    cityIbge: trimOrUndefined(address.cityIbge),
    stateUf: trimOrUndefined(address.stateUf?.toUpperCase()),
    country: trimOrUndefined(address.country?.toUpperCase()),
  };

  const hasAny = Object.values(payload).some((v) => !!v);
  return hasAny ? payload : undefined;
}

export function CustomerCompanyFormModal({ companyId, onClose, onSaved }: Props) {
  const naming = useNaming();
  const isEdit = typeof companyId === "number";
  const confirm = useConfirmStore((s) => s.confirm);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [tutors, setTutors] = useState<TutorListItemResponse[]>([]);
  const lastCepLookup = useRef<string | null>(null);

  const [form, setForm] = useState<FormState>({
    tutorId: "",
    legalName: "",
    tradeName: "",
    cnpj: "",
    phone: "",
    email: "",
    ie: "",
    ieIndicator: "NON_CONTRIBUTOR",
    address: { ...EMPTY_ADDRESS },
  });

  const cnpjInvalid = useMemo(() => {
    const digits = onlyDigits(form.cnpj);
    if (!digits) return false;
    if (digits.length < 14) return true;
    return !validateCnpj(digits);
  }, [form.cnpj]);

  const addressPayload = useMemo(() => buildAddress(form.address), [form.address]);

  const addressInvalid = useMemo(() => {
    if (!addressPayload) return false;
    return !addressPayload.zipCode || !addressPayload.street || !addressPayload.cityName || !addressPayload.stateUf;
  }, [addressPayload]);

  const canSubmit = useMemo(() => {
    if (!form.legalName.trim()) return false;
    if (!form.tutorId && !isEdit) return false;
    if (!onlyDigits(form.cnpj)) return false;
    if (cnpjInvalid) return false;
    if (addressInvalid) return false;
    return true;
  }, [addressInvalid, cnpjInvalid, form.cnpj, form.legalName, form.tutorId, isEdit]);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      setLoading(true);
      try {
        const tutorsResp = await listTutors({ page: 0, size: 300, sort: "name,asc", active: true });
        if (!mounted) return;
        setTutors(tutorsResp.content ?? []);

        if (!isEdit) return;

        const company = await getCustomerCompanyById(companyId!);
        if (!mounted) return;

        setForm({
          tutorId: String(company.tutorId),
          legalName: company.legalName ?? "",
          tradeName: company.tradeName ?? "",
          cnpj: formatCnpj(company.cnpj ?? ""),
          phone: formatPhone(company.phone ?? ""),
          email: company.email ?? "",
          ie: company.fiscal?.ie ?? "",
          ieIndicator: company.fiscal?.ieIndicator ?? "NON_CONTRIBUTOR",
          address: {
            ...toAddressState(company.address),
            zipCode: formatZipCode(company.address?.zipCode ?? ""),
          },
        });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, [companyId, isEdit]);

  async function handleCepBlur() {
    const digits = onlyDigits(form.address.zipCode);
    if (digits.length !== 8) return;
    if (lastCepLookup.current === digits) return;

    setCepLoading(true);
    try {
      const data = await getAddressByCep(digits);
      if (data.erro) {
        await confirm({
          title: naming.getTitle("customerCompany"),
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
      await confirm({
        title: naming.getTitle("customerCompany"),
        message: apiMsg ?? naming.getMessage("cepLookupError"),
        confirmText: naming.getLabel("ok"),
      });
    } finally {
      setCepLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const tutorId = Number(form.tutorId);
    if (!isEdit && !Number.isFinite(tutorId)) return;

    const ok = await confirm({
      title: isEdit ? naming.getMessage("saveChanges") : naming.getMessage("createCustomerCompany"),
      message: isEdit ? naming.getMessage("saveChangesCustomerCompanyConfirm") : naming.getMessage("createCustomerCompanyConfirm"),
      confirmText: naming.getLabel("confirm"),
      cancelText: naming.getLabel("cancel"),
      danger: false,
    });
    if (!ok) return;

    setSaving(true);
    try {
      const fiscalPayload = {
        ie: trimOrUndefined(form.ie),
        ieIndicator: form.ieIndicator,
      };

      if (isEdit) {
        const payload: UpdateCustomerCompanyRequest = {
          legalName: form.legalName.trim(),
          tradeName: trimOrUndefined(form.tradeName),
          cnpj: onlyDigits(form.cnpj),
          phone: trimOrUndefined(form.phone),
          email: trimOrUndefined(form.email),
          address: addressPayload,
          fiscal: fiscalPayload,
        };

        await updateCustomerCompany(companyId!, payload);
      } else {
        const payload: CreateCustomerCompanyRequest = {
          tutorId,
          legalName: form.legalName.trim(),
          tradeName: trimOrUndefined(form.tradeName),
          cnpj: onlyDigits(form.cnpj),
          phone: trimOrUndefined(form.phone),
          email: trimOrUndefined(form.email),
          address: addressPayload,
          fiscal: fiscalPayload,
        };

        await createCustomerCompany(payload);
      }

      onSaved();
    } catch (error) {
      const apiMsg = getApiErrorMessage(error);
      await confirm({
        title: naming.getTitle("errorSavingCustomerCompany"),
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
          <div className={styles.title}>{isEdit ? naming.getTitle("editCustomerCompany") : naming.getTitle("newCustomerCompany")}</div>
        </div>

        {loading ? (
          <div className={styles.state}>{naming.getLabel("loading")}</div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span>{naming.getLabel("tutor")}</span>
                <select
                  value={form.tutorId}
                  onChange={(e) => setForm((s) => ({ ...s, tutorId: e.target.value }))}
                  required
                  disabled={isEdit}
                >
                  <option value="">{naming.getLabel("selectTutor")}</option>
                  {tutors.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("legalName")}</span>
                <input
                  value={form.legalName}
                  onChange={(e) => setForm((s) => ({ ...s, legalName: e.target.value }))}
                  placeholder={naming.getPlaceholder("legalName")}
                  required
                />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("tradeName")}</span>
                <input
                  value={form.tradeName}
                  onChange={(e) => setForm((s) => ({ ...s, tradeName: e.target.value }))}
                  placeholder={naming.getPlaceholder("tradeName")}
                />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("cnpj")}</span>
                <input
                  value={form.cnpj}
                  onChange={(e) => setForm((s) => ({ ...s, cnpj: formatCnpj(e.target.value) }))}
                  placeholder={naming.getPlaceholder("cnpj")}
                  aria-invalid={cnpjInvalid}
                  required
                />
                {cnpjInvalid && <div className={styles.error}>{naming.getMessage("invalidCnpj")}</div>}
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("phone")}</span>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((s) => ({ ...s, phone: formatPhone(e.target.value) }))}
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
                <span>{naming.getLabel("ie")}</span>
                <input
                  value={form.ie}
                  onChange={(e) => setForm((s) => ({ ...s, ie: e.target.value }))}
                  placeholder={naming.getPlaceholder("ie")}
                />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("ieIndicator")}</span>
                <select
                  value={form.ieIndicator}
                  onChange={(e) => setForm((s) => ({ ...s, ieIndicator: e.target.value as IeIndicator }))}
                  required
                >
                  {IE_INDICATOR_OPTIONS.map((indicator) => (
                    <option key={indicator} value={indicator}>
                      {naming.t(`ieIndicator.${indicator}`)}
                    </option>
                  ))}
                </select>
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
                <span>{naming.getLabel("stateUf")}</span>
                <input
                  value={form.address.stateUf}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, address: { ...s.address, stateUf: e.target.value.toUpperCase() } }))
                  }
                  placeholder={naming.getPlaceholder("stateUf")}
                  maxLength={2}
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
                <span>{naming.getLabel("country")}</span>
                <input
                  value={form.address.country}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, address: { ...s.address, country: e.target.value.toUpperCase() } }))
                  }
                  placeholder={naming.getPlaceholder("country")}
                />
              </label>
            </div>

            {addressInvalid && <div className={styles.error}>{naming.getMessage("companyAddressRequiredFields")}</div>}

            <div className={styles.actions}>
              <button type="button" className={styles.btnGhost} onClick={onClose} disabled={saving}>
                {naming.getLabel("cancel")}
              </button>
              <button type="submit" className={styles.btnPrimary} disabled={!canSubmit || saving}>
                {saving ? naming.getLabel("saving") : naming.getLabel("save")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
