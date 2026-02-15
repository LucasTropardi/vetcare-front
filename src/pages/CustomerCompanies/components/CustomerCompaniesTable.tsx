import styles from "./CustomerCompaniesTable.module.css";
import { PenIcon, TrashIcon } from "@phosphor-icons/react";
import { useNaming } from "../../../i18n/useNaming";
import type { CustomerCompanyListItemResponse, Role } from "../../../services/api/types";
import { CustomerCompanyStatusBadge } from "./CustomerCompanyStatusBadge";

type Props = {
  companies: CustomerCompanyListItemResponse[];
  loading: boolean;
  hasMore: boolean;
  currentRole?: Role;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onLoadMore: () => void;
};

function canDeleteCustomerCompany(role?: Role) {
  return role === "ADMIN" || role === "VET";
}

function formatCnpj(value?: string) {
  if (!value) return "-";
  const digits = value.replace(/\D+/g, "").slice(0, 14);
  if (!digits) return "-";
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

export function CustomerCompaniesTable({
  companies,
  loading,
  hasMore,
  currentRole,
  onEdit,
  onDelete,
  onLoadMore,
}: Props) {
  const naming = useNaming();

  if (loading) return <div className={styles.state}>{naming.getLabel("loading")}</div>;
  if (!companies.length) return <div className={styles.state}>{naming.getMessage("noCustomerCompaniesFound")}</div>;

  return (
    <div
      className={styles.tableWrap}
      onScroll={(e) => {
        if (!hasMore || loading) return;
        const target = e.currentTarget;
        const threshold = 80;
        const reachedBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - threshold;
        if (reachedBottom) onLoadMore();
      }}
    >
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{naming.getLabel("legalName")}</th>
            <th>{naming.getLabel("tradeName")}</th>
            <th>{naming.getLabel("cnpj")}</th>
            <th>{naming.getLabel("tutor")}</th>
            <th>{naming.getLabel("status")}</th>
            <th className={styles.actionsCol}>{naming.getLabel("actions")}</th>
          </tr>
        </thead>

        <tbody>
          {companies.map((company) => {
            const canDelete = canDeleteCustomerCompany(currentRole);

            return (
              <tr key={company.id}>
                <td className={styles.nameCell}>{company.legalName}</td>
                <td className={styles.muted}>{company.tradeName ?? "-"}</td>
                <td className={styles.muted}>{formatCnpj(company.cnpj)}</td>
                <td className={styles.muted}>#{company.tutorId}</td>
                <td>
                  <CustomerCompanyStatusBadge active={company.active} />
                </td>
                <td className={styles.actions}>
                  <button className={styles.actionBtn} onClick={() => onEdit(company.id)} title={naming.getLabel("edit")}>
                    <PenIcon size={20} />
                  </button>

                  <button
                    className={`${styles.actionBtn} ${styles.danger}`}
                    onClick={() => onDelete(company.id)}
                    disabled={!canDelete}
                    title={!canDelete ? naming.getMessage("noPermission") : naming.getLabel("delete")}
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
