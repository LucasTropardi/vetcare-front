import styles from "./ProductsTable.module.css";
import { PenIcon, TrashIcon } from "@phosphor-icons/react";
import { useNaming } from "../../../i18n/useNaming";
import type { ProductListItemResponse, Role } from "../../../services/api/types";
import { ProductStatusBadge } from "./ProductStatusBadge";

type Props = {
  products: ProductListItemResponse[];
  loading: boolean;
  hasMore: boolean;
  currentRole?: Role;
  onEdit: (id: number) => void;
  onDeactivate: (id: number) => void;
  onLoadMore: () => void;
};

function canDeactivateProduct(role?: Role) {
  return role === "ADMIN" || role === "VET";
}

function formatMoney(value?: number) {
  if (value == null) return "-";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function ProductsTable({
  products,
  loading,
  hasMore,
  currentRole,
  onEdit,
  onDeactivate,
  onLoadMore,
}: Props) {
  const naming = useNaming();

  if (loading) return <div className={styles.state}>{naming.getLabel("loading")}</div>;
  if (!products.length) return <div className={styles.state}>{naming.getMessage("noProductsFound")}</div>;

  return (
    <div
      className={styles.tableWrap}
      onScroll={(e) => {
        if (!hasMore || loading) return;
        const target = e.currentTarget;
        const reachedBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 80;
        if (reachedBottom) onLoadMore();
      }}
    >
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{naming.getLabel("sku")}</th>
            <th>{naming.getLabel("name")}</th>
            <th>{naming.getLabel("productCategory")}</th>
            <th>{naming.getLabel("unit")}</th>
            <th>{naming.getLabel("salePrice")}</th>
            <th>{naming.getLabel("status")}</th>
            <th className={styles.actionsCol}>{naming.getLabel("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const canDeactivate = canDeactivateProduct(currentRole);
            return (
              <tr key={product.id}>
                <td className={styles.muted}>{product.sku}</td>
                <td className={styles.nameCell}>{product.name}</td>
                <td className={styles.muted}>{naming.t(`productCategory.${product.category}`)}</td>
                <td className={styles.muted}>{product.unit}</td>
                <td className={styles.muted}>{formatMoney(product.salePrice)}</td>
                <td>
                  <ProductStatusBadge active={product.active} />
                </td>
                <td className={styles.actions}>
                  <button className={styles.actionBtn} onClick={() => onEdit(product.id)} title={naming.getLabel("edit")}>
                    <PenIcon size={20} />
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.danger}`}
                    onClick={() => onDeactivate(product.id)}
                    disabled={!canDeactivate || !product.active}
                    title={!canDeactivate ? naming.getMessage("noPermission") : naming.getLabel("deactivate")}
                  >
                    <TrashIcon size={20} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {hasMore && <div className={styles.moreState}>{naming.getLabel("loading")}</div>}
    </div>
  );
}
