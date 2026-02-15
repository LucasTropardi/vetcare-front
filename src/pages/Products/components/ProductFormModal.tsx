import { useEffect, useMemo, useState } from "react";
import styles from "./ProductFormModal.module.css";
import { useConfirmStore } from "../../../store/confirm.store";
import { useNaming } from "../../../i18n/useNaming";
import { getApiErrorMessage } from "../../../services/api/errors";
import {
  createProduct,
  getProductById,
  updateProduct,
} from "../../../services/api/products.service";
import {
  FISCAL_ORIGIN_OPTIONS,
  ITEM_TYPE_OPTIONS,
  PRODUCT_CATEGORY_OPTIONS,
} from "../../../services/api/types";
import type {
  CreateProductRequest,
  FiscalOriginCode,
  ItemType,
  ProductCategory,
  ProductResponse,
  UpdateProductRequest,
} from "../../../services/api/types";

type Props = {
  productId?: number;
  onClose: () => void;
  onSaved: () => void;
};

type FormState = {
  sku: string;
  name: string;
  itemType: ItemType;
  category: ProductCategory;
  unit: string;
  salePrice: string;
  costPrice: string;
  minStock: string;
  ncm: string;
  cest: string;
  origin: "" | FiscalOriginCode;
  gtinEan: string;
  gtinEanTrib: string;
  unitTrib: string;
  tribFactor: string;
  cbenef: string;
  serviceListCode: string;
};

function trimOrUndefined(v: string) {
  const t = v.trim();
  return t ? t : undefined;
}

function digitsOrUndefined(v: string) {
  const d = v.replace(/\D+/g, "");
  return d || undefined;
}

function numberOrUndefined(v: string) {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function toFormState(product: ProductResponse): FormState {
  return {
    sku: product.sku ?? "",
    name: product.name ?? "",
    itemType: product.itemType,
    category: product.category,
    unit: product.unit ?? "UN",
    salePrice: String(product.salePrice ?? ""),
    costPrice: String(product.costPrice ?? ""),
    minStock: String(product.minStock ?? ""),
    ncm: product.fiscal?.ncm ?? "",
    cest: product.fiscal?.cest ?? "",
    origin: product.fiscal?.origin ?? "",
    gtinEan: product.fiscal?.gtinEan ?? "",
    gtinEanTrib: product.fiscal?.gtinEanTrib ?? "",
    unitTrib: product.fiscal?.unitTrib ?? "",
    tribFactor: product.fiscal?.tribFactor != null ? String(product.fiscal.tribFactor) : "",
    cbenef: product.fiscal?.cbenef ?? "",
    serviceListCode: product.fiscal?.serviceListCode ?? "",
  };
}

function validateFiscalRules(form: FormState, naming: ReturnType<typeof useNaming>) {
  const isProduct = form.itemType === "PRODUCT";
  const hasTribUnit = !!trimOrUndefined(form.unitTrib);
  const hasTribFactor = !!numberOrUndefined(form.tribFactor);
  const hasGtinTrib = !!digitsOrUndefined(form.gtinEanTrib);
  const anyTrib = hasTribUnit || hasTribFactor || hasGtinTrib;

  if (anyTrib && !(hasTribUnit && hasTribFactor && hasGtinTrib)) {
    return naming.getMessage("productFiscalTribGroupError");
  }

  if (form.cest && !form.ncm) {
    return naming.getMessage("productFiscalCestNeedsNcm");
  }

  if (isProduct) {
    if (!digitsOrUndefined(form.ncm) || digitsOrUndefined(form.ncm)?.length !== 8) {
      return naming.getMessage("productFiscalNcmRequiredForProduct");
    }
    if (!form.origin) {
      return naming.getMessage("productFiscalOriginRequiredForProduct");
    }
    if (trimOrUndefined(form.serviceListCode)) {
      return naming.getMessage("productFiscalServiceCodeForbiddenForProduct");
    }
  } else {
    if (!trimOrUndefined(form.serviceListCode)) {
      return naming.getMessage("productFiscalServiceCodeRequiredForService");
    }
    if (trimOrUndefined(form.ncm)) return naming.getMessage("productFiscalNcmForbiddenForService");
    if (trimOrUndefined(form.cest)) return naming.getMessage("productFiscalCestForbiddenForService");
    if (trimOrUndefined(form.gtinEan)) return naming.getMessage("productFiscalGtinForbiddenForService");
    if (trimOrUndefined(form.gtinEanTrib)) return naming.getMessage("productFiscalGtinTribForbiddenForService");
    if (trimOrUndefined(form.cbenef)) return naming.getMessage("productFiscalCbenefForbiddenForService");
  }

  return null;
}

export function ProductFormModal({ productId, onClose, onSaved }: Props) {
  const naming = useNaming();
  const confirm = useConfirmStore((s) => s.confirm);
  const isEdit = typeof productId === "number";

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    sku: "",
    name: "",
    itemType: "PRODUCT",
    category: "OTHER",
    unit: "UN",
    salePrice: "0.00",
    costPrice: "0.00",
    minStock: "0",
    ncm: "",
    cest: "",
    origin: "",
    gtinEan: "",
    gtinEanTrib: "",
    unitTrib: "",
    tribFactor: "",
    cbenef: "",
    serviceListCode: "",
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!isEdit) return;
      setLoading(true);
      try {
        const response = await getProductById(productId!);
        if (!mounted) return;
        setForm(toFormState(response));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [isEdit, productId]);

  useEffect(() => {
    setForm((current) => {
      if (current.itemType === "PRODUCT") {
        if (!current.serviceListCode) return current;
        return { ...current, serviceListCode: "" };
      }

      return {
        ...current,
        ncm: "",
        cest: "",
        origin: "",
        gtinEan: "",
        gtinEanTrib: "",
        unitTrib: "",
        tribFactor: "",
        cbenef: "",
      };
    });
  }, [form.itemType]);

  const fiscalError = useMemo(() => validateFiscalRules(form, naming), [form, naming]);

  const canSubmit = useMemo(() => {
    if (!form.sku.trim()) return false;
    if (!form.name.trim()) return false;
    if (!form.unit.trim()) return false;
    if (numberOrUndefined(form.salePrice) == null) return false;
    if (numberOrUndefined(form.costPrice) == null) return false;
    if (numberOrUndefined(form.minStock) == null) return false;
    if (fiscalError) return false;
    return true;
  }, [fiscalError, form]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const salePrice = numberOrUndefined(form.salePrice);
    const costPrice = numberOrUndefined(form.costPrice);
    const minStock = numberOrUndefined(form.minStock);
    if (salePrice == null || costPrice == null || minStock == null) return;

    const ok = await confirm({
      title: isEdit ? naming.getMessage("saveChanges") : naming.getMessage("createProduct"),
      message: isEdit ? naming.getMessage("saveChangesProductConfirm") : naming.getMessage("createProductConfirm"),
      confirmText: naming.getLabel("confirm"),
      cancelText: naming.getLabel("cancel"),
      danger: false,
    });
    if (!ok) return;

    setSaving(true);
    try {
      const payloadBase = {
        sku: form.sku.trim(),
        name: form.name.trim(),
        itemType: form.itemType,
        category: form.category,
        unit: form.unit.trim().toUpperCase(),
        salePrice,
        costPrice,
        minStock,
        fiscal: {
          ncm: digitsOrUndefined(form.ncm),
          cest: digitsOrUndefined(form.cest),
          origin: form.origin || undefined,
          gtinEan: digitsOrUndefined(form.gtinEan),
          gtinEanTrib: digitsOrUndefined(form.gtinEanTrib),
          unitTrib: trimOrUndefined(form.unitTrib),
          tribFactor: numberOrUndefined(form.tribFactor),
          cbenef: trimOrUndefined(form.cbenef),
          serviceListCode: trimOrUndefined(form.serviceListCode),
        },
      };

      if (isEdit) {
        await updateProduct(productId!, payloadBase as UpdateProductRequest);
      } else {
        await createProduct(payloadBase as CreateProductRequest);
      }

      onSaved();
    } catch (error) {
      const apiMsg = getApiErrorMessage(error);
      await confirm({
        title: naming.getTitle("errorSavingProduct"),
        message: apiMsg ?? (error instanceof Error ? error.message : naming.getMessage("unknown")),
        confirmText: naming.getLabel("ok"),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.title}>{isEdit ? naming.getTitle("editProduct") : naming.getTitle("newProduct")}</div>
        </div>

        {loading ? (
          <div className={styles.state}>{naming.getLabel("loading")}</div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span>{naming.getLabel("sku")}</span>
                <input value={form.sku} onChange={(e) => setForm((s) => ({ ...s, sku: e.target.value }))} required />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("name")}</span>
                <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("itemType")}</span>
                <select value={form.itemType} onChange={(e) => setForm((s) => ({ ...s, itemType: e.target.value as ItemType }))}>
                  {ITEM_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>{naming.t(`itemType.${type}`)}</option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("productCategory")}</span>
                <select value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value as ProductCategory }))}>
                  {PRODUCT_CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>{naming.t(`productCategory.${category}`)}</option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("unit")}</span>
                <input value={form.unit} onChange={(e) => setForm((s) => ({ ...s, unit: e.target.value }))} required />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("salePrice")}</span>
                <input value={form.salePrice} onChange={(e) => setForm((s) => ({ ...s, salePrice: e.target.value }))} inputMode="decimal" required />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("costPrice")}</span>
                <input value={form.costPrice} onChange={(e) => setForm((s) => ({ ...s, costPrice: e.target.value }))} inputMode="decimal" required />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("minStock")}</span>
                <input value={form.minStock} onChange={(e) => setForm((s) => ({ ...s, minStock: e.target.value }))} inputMode="decimal" required />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("ncm")}</span>
                <input value={form.ncm} onChange={(e) => setForm((s) => ({ ...s, ncm: e.target.value.replace(/\D+/g, "").slice(0, 8) }))} />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("cest")}</span>
                <input value={form.cest} onChange={(e) => setForm((s) => ({ ...s, cest: e.target.value.replace(/\D+/g, "").slice(0, 7) }))} />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("origin")}</span>
                <select value={form.origin} onChange={(e) => setForm((s) => ({ ...s, origin: e.target.value as "" | FiscalOriginCode }))}>
                  <option value="">{naming.getLabel("optional")}</option>
                  {FISCAL_ORIGIN_OPTIONS.map((origin) => (
                    <option key={origin.code} value={origin.code}>{origin.code} - {origin.label}</option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("gtinEan")}</span>
                <input value={form.gtinEan} onChange={(e) => setForm((s) => ({ ...s, gtinEan: e.target.value.replace(/\D+/g, "").slice(0, 14) }))} />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("gtinEanTrib")}</span>
                <input value={form.gtinEanTrib} onChange={(e) => setForm((s) => ({ ...s, gtinEanTrib: e.target.value.replace(/\D+/g, "").slice(0, 14) }))} />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("unitTrib")}</span>
                <input value={form.unitTrib} onChange={(e) => setForm((s) => ({ ...s, unitTrib: e.target.value }))} />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("tribFactor")}</span>
                <input value={form.tribFactor} onChange={(e) => setForm((s) => ({ ...s, tribFactor: e.target.value }))} inputMode="decimal" />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("cbenef")}</span>
                <input value={form.cbenef} onChange={(e) => setForm((s) => ({ ...s, cbenef: e.target.value }))} />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("serviceListCode")}</span>
                <input value={form.serviceListCode} onChange={(e) => setForm((s) => ({ ...s, serviceListCode: e.target.value }))} />
              </label>
            </div>

            {fiscalError && <div className={styles.error}>{fiscalError}</div>}

            <div className={styles.actions}>
              <button type="button" className={styles.btnGhost} onClick={onClose} disabled={saving}>{naming.getLabel("cancel")}</button>
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
