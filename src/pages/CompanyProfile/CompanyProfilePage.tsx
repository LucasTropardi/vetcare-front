import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./CompanyProfilePage.module.css";
import { useNaming } from "../../i18n/useNaming";
import { useAuthStore } from "../../store/auth.store";
import { useConfirmStore } from "../../store/confirm.store";
import { getApiErrorMessage } from "../../services/api/errors";
import { getAddressByCep } from "../../services/api/viacep.service";
import { validateCnpj } from "../../utils/documentValidation";
import { CRT_OPTIONS, IE_INDICATOR_OPTIONS } from "../../services/api/types";
import type {
  Crt,
  IeIndicator,
  Role,
  CompanyProfileAddressRequest,
  UpdateCompanyProfileRequest,
} from "../../services/api/types";
import { getCurrentCompanyProfile, updateCurrentCompanyProfile } from "../../services/api/company.service";

type FormState = {
  legalName: string;
  tradeName: string;
  cnpj: string;
  phone: string;
  email: string;
  headquarter: boolean;
  ie: string;
  ieIndicator: IeIndicator;
  crt: Crt;
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

function canEditCompany(role?: Role) {
  return role === "ADMIN" || role === "VET";
}

function onlyDigits(value: string) {
  return value.replace(/\D+/g, "");
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

function trimOrUndefined(value: string) {
  const v = value.trim();
  return v ? v : undefined;
}

function buildAddress(form: FormState): CompanyProfileAddressRequest {
  return {
    zipCode: onlyDigits(form.zipCode),
    street: form.street.trim(),
    number: trimOrUndefined(form.number),
    complement: trimOrUndefined(form.complement),
    neighborhood: form.neighborhood.trim(),
    cityName: form.cityName.trim(),
    cityIbge: trimOrUndefined(form.cityIbge),
    stateUf: form.stateUf.trim().toUpperCase(),
    country: trimOrUndefined(form.country.toUpperCase()),
  };
}

export function CompanyProfilePage() {
  const naming = useNaming();
  const me = useAuthStore((s) => s.me);
  const confirm = useConfirmStore((s) => s.confirm);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);

  const lastCepLookup = useRef<string | null>(null);
  const editable = useMemo(() => canEditCompany(me?.role), [me?.role]);

  const cnpjInvalid = useMemo(() => {
    const digits = onlyDigits(form?.cnpj ?? "");
    if (!digits) return true;
    return !validateCnpj(digits);
  }, [form?.cnpj]);

  const missingForFiscal = useMemo(() => {
    if (!form) return 0;
    const required = [
      form.legalName.trim(),
      onlyDigits(form.cnpj),
      form.street.trim(),
      form.neighborhood.trim(),
      form.cityName.trim(),
      form.stateUf.trim(),
      onlyDigits(form.zipCode),
      form.cityIbge.trim(),
    ];

    let missing = required.filter((value) => !value).length;
    if (form.ieIndicator === "CONTRIBUTOR" && !form.ie.trim()) missing += 1;
    return missing;
  }, [form]);

  const canSave = useMemo(() => {
    if (!editable || !form) return false;
    if (!form.legalName.trim()) return false;
    if (cnpjInvalid) return false;
    if (!form.street.trim() || !form.cityName.trim() || !form.stateUf.trim() || !onlyDigits(form.zipCode)) return false;
    if (!form.ieIndicator || !form.crt) return false;
    if (form.ieIndicator === "CONTRIBUTOR" && !form.ie.trim()) return false;
    return true;
  }, [cnpjInvalid, editable, form]);

  async function loadProfile() {
    setLoading(true);
    try {
      const response = await getCurrentCompanyProfile();
      setForm({
        legalName: response.legalName ?? "",
        tradeName: response.tradeName ?? "",
        cnpj: formatCnpj(response.cnpj ?? ""),
        phone: formatPhone(response.phone ?? ""),
        email: response.email ?? "",
        headquarter: response.headquarter,
        ie: response.fiscalConfig?.ie ?? "",
        ieIndicator: response.fiscalConfig?.ieIndicator ?? "NON_CONTRIBUTOR",
        crt: response.fiscalConfig?.crt ?? "SIMPLES_NACIONAL",
        zipCode: formatZipCode(response.address?.zipCode ?? ""),
        street: response.address?.street ?? "",
        number: response.address?.number ?? "",
        complement: response.address?.complement ?? "",
        neighborhood: response.address?.neighborhood ?? "",
        cityName: response.address?.cityName ?? "",
        cityIbge: response.address?.cityIbge ?? "",
        stateUf: response.address?.stateUf ?? "",
        country: response.address?.country ?? "BR",
      });
      setLoadedAt(response.updatedAt);
    } catch (error) {
      const apiMsg = getApiErrorMessage(error);
      await confirm({
        title: naming.getTitle("companyProfile"),
        message: apiMsg ?? naming.getMessage("unknown"),
        confirmText: naming.getLabel("ok"),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = `${naming.getTitle("companyProfile")} • ${naming.getApp("name")}`;
  }, [naming]);

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleCepBlur() {
    if (!form) return;

    const digits = onlyDigits(form.zipCode);
    if (digits.length !== 8) return;
    if (lastCepLookup.current === digits) return;

    setCepLoading(true);
    try {
      const data = await getAddressByCep(digits);
      if (data.erro) {
        await confirm({
          title: naming.getTitle("companyProfile"),
          message: naming.getMessage("cepNotFound"),
          confirmText: naming.getLabel("ok"),
        });
        return;
      }

      setForm((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          street: data.logradouro ?? prev.street,
          neighborhood: data.bairro ?? prev.neighborhood,
          cityName: data.localidade ?? prev.cityName,
          stateUf: data.uf ?? prev.stateUf,
          cityIbge: data.ibge ?? prev.cityIbge,
          country: prev.country.trim() ? prev.country : "BR",
        };
      });
      lastCepLookup.current = digits;
    } catch (error) {
      const apiMsg = getApiErrorMessage(error);
      await confirm({
        title: naming.getTitle("companyProfile"),
        message: apiMsg ?? naming.getMessage("cepLookupError"),
        confirmText: naming.getLabel("ok"),
      });
    } finally {
      setCepLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !canSave) return;

    const ok = await confirm({
      title: naming.getMessage("saveChanges"),
      message: naming.getMessage("saveChangesCompanyProfileConfirm"),
      confirmText: naming.getLabel("confirm"),
      cancelText: naming.getLabel("cancel"),
      danger: false,
    });
    if (!ok) return;

    setSaving(true);
    try {
      const payload: UpdateCompanyProfileRequest = {
        legalName: form.legalName.trim(),
        tradeName: trimOrUndefined(form.tradeName),
        cnpj: onlyDigits(form.cnpj),
        phone: trimOrUndefined(form.phone),
        email: trimOrUndefined(form.email),
        headquarter: form.headquarter,
        address: buildAddress(form),
        fiscalConfig: {
          ie: trimOrUndefined(form.ie),
          ieIndicator: form.ieIndicator,
          crt: form.crt,
        },
      };

      const updated = await updateCurrentCompanyProfile(payload);
      setLoadedAt(updated.updatedAt);
      await confirm({
        title: naming.getTitle("companyProfile"),
        message: naming.getMessage("companyProfileSaved"),
        confirmText: naming.getLabel("ok"),
      });
    } catch (error) {
      const apiMsg = getApiErrorMessage(error);
      await confirm({
        title: naming.getTitle("errorSavingCompanyProfile"),
        message: apiMsg ?? naming.getMessage("unknown"),
        confirmText: naming.getLabel("ok"),
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) {
    return <div className={styles.loading}>{naming.getLabel("loading")}</div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <h1 className={styles.title}>{naming.getTitle("companyProfile")}</h1>
          <p className={styles.subtitle}>{naming.getMessage("companyProfileSubtitle")}</p>
        </div>
        <div className={styles.badges}>
          <span className={styles.badge} data-ok={missingForFiscal === 0 ? "true" : "false"}>
            {missingForFiscal === 0
              ? naming.getMessage("readyToIssueFiscal")
              : naming.getMessage("fiscalPendingFields", { count: missingForFiscal })}
          </span>
          <span className={styles.badgeMuted}>
            {form.headquarter ? naming.getLabel("headquarter") : naming.getLabel("branch")}
          </span>
        </div>
      </header>

      <form className={styles.form} onSubmit={handleSave}>
        <section className={styles.card}>
          <h2>{naming.getTitle("companyIdentity")}</h2>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>{naming.getLabel("legalName")}</span>
              <input
                value={form.legalName}
                onChange={(e) => setForm((s) => (s ? { ...s, legalName: e.target.value } : s))}
                disabled={!editable}
              />
            </label>

            <label className={styles.field}>
              <span>{naming.getLabel("tradeName")}</span>
              <input
                value={form.tradeName}
                onChange={(e) => setForm((s) => (s ? { ...s, tradeName: e.target.value } : s))}
                disabled={!editable}
              />
            </label>

            <label className={styles.field}>
              <span>{naming.getLabel("cnpj")}</span>
              <input
                value={form.cnpj}
                onChange={(e) => setForm((s) => (s ? { ...s, cnpj: formatCnpj(e.target.value) } : s))}
                aria-invalid={cnpjInvalid}
                disabled={!editable}
              />
              {cnpjInvalid && <small className={styles.error}>{naming.getMessage("invalidCnpj")}</small>}
            </label>

            <label className={styles.field}>
              <span>{naming.getLabel("phone")}</span>
              <input
                value={form.phone}
                onChange={(e) => setForm((s) => (s ? { ...s, phone: formatPhone(e.target.value) } : s))}
                disabled={!editable}
              />
            </label>

            <label className={styles.field}>
              <span>{naming.getLabel("email")}</span>
              <input
                value={form.email}
                onChange={(e) => setForm((s) => (s ? { ...s, email: e.target.value } : s))}
                disabled={!editable}
              />
            </label>

            <label className={`${styles.field} ${styles.toggleField}`}>
              <span>{naming.getLabel("headquarter")}</span>
              <button
                type="button"
                className={styles.toggle}
                data-active={form.headquarter ? "true" : "false"}
                disabled={!editable}
                onClick={() => setForm((s) => (s ? { ...s, headquarter: !s.headquarter } : s))}
              >
                <span className={styles.toggleKnob} />
                <strong>{form.headquarter ? naming.getLabel("yes") : naming.getLabel("no")}</strong>
              </button>
            </label>
          </div>
        </section>

        <section className={styles.card}>
          <h2>{naming.getTitle("companyFiscal")}</h2>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>{naming.getLabel("ieIndicator")}</span>
              <select
                value={form.ieIndicator}
                onChange={(e) => setForm((s) => (s ? { ...s, ieIndicator: e.target.value as IeIndicator } : s))}
                disabled={!editable}
              >
                {IE_INDICATOR_OPTIONS.map((indicator) => (
                  <option key={indicator} value={indicator}>
                    {naming.t(`ieIndicator.${indicator}`)}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span>{naming.getLabel("ie")}</span>
              <input
                value={form.ie}
                onChange={(e) => setForm((s) => (s ? { ...s, ie: e.target.value } : s))}
                disabled={!editable}
              />
            </label>

            <label className={styles.field}>
              <span>{naming.getLabel("crt")}</span>
              <select
                value={form.crt}
                onChange={(e) => setForm((s) => (s ? { ...s, crt: e.target.value as Crt } : s))}
                disabled={!editable}
              >
                {CRT_OPTIONS.map((crt) => (
                  <option key={crt} value={crt}>
                    {naming.t(`crt.${crt}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className={styles.card}>
          <h2>{naming.getTitle("companyAddress")}</h2>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>{naming.getLabel("zipCode")}{cepLoading ? ` ${naming.getLabel("loading")}` : ""}</span>
              <input
                value={form.zipCode}
                onChange={(e) => setForm((s) => (s ? { ...s, zipCode: formatZipCode(e.target.value) } : s))}
                onBlur={handleCepBlur}
                disabled={!editable}
              />
            </label>

            <label className={styles.field}>
              <span>{naming.getLabel("street")}</span>
              <input
                value={form.street}
                onChange={(e) => setForm((s) => (s ? { ...s, street: e.target.value } : s))}
                disabled={!editable}
              />
            </label>

            <label className={styles.field}>
              <span>{naming.getLabel("number")}</span>
              <input
                value={form.number}
                onChange={(e) => setForm((s) => (s ? { ...s, number: e.target.value } : s))}
                disabled={!editable}
              />
            </label>

            <label className={styles.field}>
              <span>{naming.getLabel("complement")}</span>
              <input
                value={form.complement}
                onChange={(e) => setForm((s) => (s ? { ...s, complement: e.target.value } : s))}
                disabled={!editable}
              />
            </label>

            <label className={styles.field}>
              <span>{naming.getLabel("neighborhood")}</span>
              <input
                value={form.neighborhood}
                onChange={(e) => setForm((s) => (s ? { ...s, neighborhood: e.target.value } : s))}
                disabled={!editable}
              />
            </label>

            <label className={styles.field}>
              <span>{naming.getLabel("cityName")}</span>
              <input
                value={form.cityName}
                onChange={(e) => setForm((s) => (s ? { ...s, cityName: e.target.value } : s))}
                disabled={!editable}
              />
            </label>

            <label className={styles.field}>
              <span>{naming.getLabel("cityIbge")}</span>
              <input
                value={form.cityIbge}
                onChange={(e) => setForm((s) => (s ? { ...s, cityIbge: e.target.value } : s))}
                disabled={!editable}
              />
            </label>

            <label className={styles.field}>
              <span>{naming.getLabel("stateUf")}</span>
              <input
                maxLength={2}
                value={form.stateUf}
                onChange={(e) => setForm((s) => (s ? { ...s, stateUf: e.target.value.toUpperCase() } : s))}
                disabled={!editable}
              />
            </label>

            <label className={styles.field}>
              <span>{naming.getLabel("country")}</span>
              <input
                value={form.country}
                onChange={(e) => setForm((s) => (s ? { ...s, country: e.target.value.toUpperCase() } : s))}
                disabled={!editable}
              />
            </label>
          </div>
        </section>

        <footer className={styles.footer}>
          <span className={styles.meta}>
            {loadedAt ? `${naming.getLabel("lastUpdate")}: ${new Date(loadedAt).toLocaleString("pt-BR")}` : ""}
          </span>

          {editable ? (
            <button className={styles.primaryBtn} type="submit" disabled={!canSave || saving}>
              {saving ? naming.getLabel("saving") : naming.getLabel("save")}
            </button>
          ) : (
            <span className={styles.readOnly}>{naming.getMessage("readOnlyCompanyProfile")}</span>
          )}
        </footer>
      </form>
    </div>
  );
}
