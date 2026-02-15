import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import styles from "./StockNewMovementPage.module.css";
import { useNaming } from "../../i18n/useNaming";
import { useAuthStore } from "../../store/auth.store";
import { getApiErrorMessage } from "../../services/api/errors";
import { createStockMovement } from "../../services/api/stock.service";
import type {
  CreateStockMovementRequest,
  ProductListItemResponse,
  Role,
  StockMovementType,
} from "../../services/api/types";
import { getProductById } from "../../services/api/products.service";
import { ProductLookupModal } from "./components/ProductLookupModal";

type FormState = {
  direction: "IN" | "OUT";
  movementType: StockMovementType;
  quantity: string;
  unitCost: string;
  notes: string;
};
const SUCCESS_TIMEOUT_MS = 2800;
const INITIAL_FORM: FormState = {
  direction: "IN",
  movementType: "ENTRY_PURCHASE",
  quantity: "",
  unitCost: "",
  notes: "",
};

function canManageStock(role?: Role) {
  return role === "ADMIN" || role === "VET" || role === "RECEPTION";
}

function parseProductId(value: string | null): string {
  if (!value) return "";
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "";
  return String(Math.trunc(n));
}

function toNumberOrUndefined(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return undefined;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
}

function parseBrlCurrencyToNumberOrUndefined(value: string) {
  const digits = value.replace(/\D+/g, "");
  if (!digits) return undefined;
  return Number(digits) / 100;
}

function formatBrlCurrencyFromDigits(raw: string) {
  const digits = raw.replace(/\D+/g, "");
  if (!digits) return "";
  const amount = Number(digits) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

export function StockNewMovementPage() {
  const naming = useNaming();
  const me = useAuthStore((s) => s.me);
  const allowed = useMemo(() => canManageStock(me?.role), [me?.role]);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryProductId = parseProductId(searchParams.get("productId"));

  const [saving, setSaving] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductListItemResponse | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  useEffect(() => {
    document.title = `${naming.t("sidebar.stockNewMovement")} • ${naming.getApp("name")}`;
  }, [naming]);

  useEffect(() => {
    let mounted = true;
    async function loadProductFromQuery() {
      if (!queryProductId) {
        if (mounted) setSelectedProduct(null);
        return;
      }

      setLoadingProduct(true);
      try {
        const product = await getProductById(Number(queryProductId));
        if (!mounted) return;
        setSelectedProduct({
          id: product.id,
          sku: product.sku,
          name: product.name,
          category: product.category,
          unit: product.unit,
          active: product.active,
          salePrice: product.salePrice,
          costPrice: product.costPrice,
          minStock: product.minStock,
        });
      } catch {
        if (mounted) setSelectedProduct(null);
      } finally {
        if (mounted) setLoadingProduct(false);
      }
    }

    loadProductFromQuery();
    return () => {
      mounted = false;
    };
  }, [queryProductId]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(null), SUCCESS_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [success]);

  const quantity = useMemo(() => toNumberOrUndefined(form.quantity), [form.quantity]);
  const unitCost = useMemo(() => parseBrlCurrencyToNumberOrUndefined(form.unitCost), [form.unitCost]);
  const productId = selectedProduct?.id;

  const validationError = useMemo(() => {
    if (!productId) return naming.getMessage("stockMovementProductRequired");
    if (quantity == null || quantity <= 0) return naming.getMessage("stockMovementQuantityPositive");

    if (form.movementType === "ENTRY_PURCHASE") {
      if (form.direction !== "IN") return naming.getMessage("stockMovementEntryNeedsIn");
      if (unitCost == null || unitCost < 0) return naming.getMessage("stockMovementEntryCostRequired");
    }

    if (form.movementType === "EXIT_SALE" || form.movementType === "EXIT_VISIT_CONSUMPTION") {
      if (form.direction !== "OUT") return naming.getMessage("stockMovementExitNeedsOut");
      if (form.unitCost.trim()) return naming.getMessage("stockMovementExitWithoutCost");
    }

    if (form.movementType === "ADJUSTMENT") {
      if (!form.notes.trim()) return naming.getMessage("stockMovementAdjustmentNeedsNotes");
      if (unitCost != null && unitCost < 0) return naming.getMessage("stockMovementUnitCostNonNegative");
    }

    if (form.notes.length > 300) return naming.getMessage("stockMovementNotesMax");
    return null;
  }, [form, naming, productId, quantity, unitCost]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowValidation(true);
    setError(null);
    setSuccess(null);
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload: CreateStockMovementRequest = {
      productId: productId!,
      movementType: form.movementType,
      quantity: form.direction === "OUT" ? -Math.abs(quantity!) : Math.abs(quantity!),
      unitCost:
        form.movementType === "EXIT_SALE" || form.movementType === "EXIT_VISIT_CONSUMPTION"
          ? undefined
          : unitCost,
      notes: form.notes.trim() || undefined,
      referenceType: "MANUAL",
    };

    setSaving(true);
    try {
      await createStockMovement(payload);
      setSuccess(naming.getMessage("stockMovementCreated"));
      setForm(INITIAL_FORM);
      setSelectedProduct(null);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("productId");
        return next;
      });
      setShowValidation(false);
    } catch (err) {
      const apiMsg = getApiErrorMessage(err);
      setError(apiMsg ?? naming.getMessage("unknown"));
    } finally {
      setSaving(false);
    }
  }

  if (!allowed) {
    return (
      <div className={styles.page}>
        <div className={styles.denied}>
          <h1>{naming.t("sidebar.stockNewMovement")}</h1>
          <p>{naming.getMessage("permissionDeniedForAccess")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{naming.t("sidebar.stockNewMovement")}</h1>
          <p className={styles.subtitle}>{naming.getMessage("manageStockNewMovement")}</p>
        </div>
        {selectedProduct && (
          <span className={styles.statusBadge}>{`${naming.getLabel("productId")}: ${selectedProduct.id}`}</span>
        )}
      </header>

      <div className={styles.card}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.productSection}>
            <div className={styles.productInfo}>
              <div className={styles.productLabel}>{naming.getLabel("selectedProduct")}</div>
              {loadingProduct ? (
                <div className={styles.productName}>{naming.getLabel("loading")}</div>
              ) : selectedProduct ? (
                <>
                  <div className={styles.productName}>{selectedProduct.name}</div>
                  <div className={styles.productMeta}>{`#${selectedProduct.id} • ${selectedProduct.sku}`}</div>
                </>
              ) : (
                <div className={styles.productEmpty}>{naming.getMessage("stockNoProductSelected")}</div>
              )}
            </div>

            <div className={styles.productActions}>
              <button type="button" className={styles.secondaryBtn} onClick={() => setPickerOpen(true)}>
                {selectedProduct ? naming.getLabel("changeProduct") : naming.getLabel("selectProduct")}
              </button>
              {selectedProduct && (
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => {
                    setSelectedProduct(null);
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev);
                      next.delete("productId");
                      return next;
                    });
                  }}
                >
                  {naming.getLabel("clearProduct")}
                </button>
              )}
            </div>
          </div>

          <div className={styles.grid}>
            <label className={styles.field}>
              <span>{naming.getLabel("movementDirection")}</span>
              <select
                value={form.direction}
                onChange={(e) =>
                  setForm((prev) => {
                    const direction = e.target.value as "IN" | "OUT";
                    let movementType = prev.movementType;
                    if (direction === "IN" && (movementType === "EXIT_SALE" || movementType === "EXIT_VISIT_CONSUMPTION")) {
                      movementType = "ENTRY_PURCHASE";
                    }
                    if (direction === "OUT" && movementType === "ENTRY_PURCHASE") {
                      movementType = "EXIT_SALE";
                    }
                    return { ...prev, direction, movementType };
                  })
                }
              >
                <option value="IN">{naming.getLabel("entry")}</option>
                <option value="OUT">{naming.getLabel("exit")}</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>{naming.getLabel("movementType")}</span>
              <select
                value={form.movementType}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    movementType: e.target.value as StockMovementType,
                    unitCost:
                      e.target.value === "EXIT_SALE" || e.target.value === "EXIT_VISIT_CONSUMPTION"
                        ? ""
                        : prev.unitCost,
                  }))
                }
              >
                {form.direction === "IN" && (
                  <option value="ENTRY_PURCHASE">{naming.t("stockMovementType.ENTRY_PURCHASE")}</option>
                )}
                {form.direction === "OUT" && (
                  <option value="EXIT_SALE">{naming.t("stockMovementType.EXIT_SALE")}</option>
                )}
                {form.direction === "OUT" && (
                  <option value="EXIT_VISIT_CONSUMPTION">{naming.t("stockMovementType.EXIT_VISIT_CONSUMPTION")}</option>
                )}
                <option value="ADJUSTMENT">{naming.t("stockMovementType.ADJUSTMENT")}</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>{naming.getLabel("quantity")}</span>
              <input
                value={form.quantity}
                onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                inputMode="decimal"
                required
              />
              <small className={styles.inlineHint}>{naming.getMessage("stockMovementQuantityHint")}</small>
            </label>

            <label className={styles.field}>
              <span>
                {naming.getLabel("unitCost")}{" "}
                {(form.movementType === "EXIT_SALE" || form.movementType === "EXIT_VISIT_CONSUMPTION") && (
                  <>({naming.getLabel("optional")})</>
                )}
              </span>
              <input
                value={form.unitCost}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    unitCost: formatBrlCurrencyFromDigits(e.target.value),
                  }))
                }
                inputMode="decimal"
                disabled={form.movementType === "EXIT_SALE" || form.movementType === "EXIT_VISIT_CONSUMPTION"}
                placeholder="R$ 0,00"
              />
            </label>

            <label className={styles.field} style={{ gridColumn: "1 / -1" }}>
              <span>
                {naming.getLabel("notes")} ({naming.getLabel("optional")})
              </span>
              <textarea
                value={form.notes}
                maxLength={300}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </label>
          </div>

          {(error || (showValidation && validationError)) && <div className={styles.error}>{error ?? validationError}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <div className={styles.footer}>
            <button className={styles.primaryBtn} type="submit" disabled={saving}>
              {saving ? naming.getLabel("saving") : naming.getLabel("newMovement")}
            </button>
          </div>
        </form>
      </div>

      {pickerOpen && (
        <ProductLookupModal
          onClose={() => setPickerOpen(false)}
          onSelect={(product) => {
            setSelectedProduct(product);
            setPickerOpen(false);
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set("productId", String(product.id));
              return next;
            });
          }}
        />
      )}
    </div>
  );
}
