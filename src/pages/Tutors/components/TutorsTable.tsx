import styles from "./TutorsTable.module.css";

import type { Role, TutorListItemResponse } from "../../../services/api/types";
import { useNaming } from "../../../i18n/useNaming";
import { PenIcon, TrashIcon } from "@phosphor-icons/react";
import { TutorStatusBadge } from "./TutorStatusBadge";

type Props = {
  tutors: TutorListItemResponse[];
  loading: boolean;
  hasMore: boolean;
  currentRole?: Role;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onLoadMore: () => void;
};

function canDeleteTutor(role?: Role) {
  return role === "ADMIN" || role === "VET";
}

function formatCpf(value?: string) {
  if (!value) return "-";
  const digits = value.replace(/\D+/g, "").slice(0, 11);
  if (!digits) return "-";
  const p1 = digits.slice(0, 3);
  const p2 = digits.slice(3, 6);
  const p3 = digits.slice(6, 9);
  const p4 = digits.slice(9, 11);
  if (digits.length <= 3) return p1;
  if (digits.length <= 6) return `${p1}.${p2}`;
  if (digits.length <= 9) return `${p1}.${p2}.${p3}`;
  return `${p1}.${p2}.${p3}-${p4}`;
}

export function TutorsTable({ tutors, loading, hasMore, currentRole, onEdit, onDelete, onLoadMore }: Props) {
  const naming = useNaming();
  if (loading) return <div className={styles.state}>{naming.getLabel("loading")}</div>;
  if (!tutors.length) return <div className={styles.state}>{naming.getMessage("noTutorsFound")}</div>;

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
            <th>{naming.getLabel("name")}</th>
            <th>{naming.getLabel("document")}</th>
            <th>{naming.getLabel("phone")}</th>
            <th>{naming.getLabel("email")}</th>
            <th>{naming.getLabel("status")}</th>
            <th className={styles.actionsCol}>{naming.getLabel("actions")}</th>
          </tr>
        </thead>

        <tbody>
          {tutors.map((t) => (
            <tr key={t.id}>
              <td className={styles.nameCell}>{t.name}</td>
              <td className={styles.muted}>{formatCpf(t.document)}</td>
              <td className={styles.muted}>{t.phone ?? "-"}</td>
              <td className={styles.muted}>{t.email ?? "-"}</td>
              <td>
                <TutorStatusBadge active={t.active} />
              </td>
              <td className={styles.actions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => onEdit(t.id)}
                  title={naming.getLabel("edit")}
                >
                  <PenIcon size={20} />
                </button>

                {(() => {
                  const canDelete = canDeleteTutor(currentRole);
                  return (
                    <button
                      className={`${styles.actionBtn} ${styles.danger}`}
                      onClick={() => onDelete(t.id)}
                      disabled={!canDelete}
                      title={!canDelete ? naming.getMessage("noPermission") : naming.getLabel("delete")}
                    >
                      <TrashIcon size={20} />
                    </button>
                  );
                })()}

              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasMore && <div className={styles.moreState}>{naming.getLabel("loading")}</div>}
    </div>
  );
}
