import styles from "./PetsTable.module.css";
import type { PetListItemResponse, Role } from "../../../services/api/types";
import { useNaming } from "../../../i18n/useNaming";
import { PenIcon, TrashIcon } from "@phosphor-icons/react";
import { PetStatusBadge } from "./PetStatusBadge";

type Props = {
  pets: PetListItemResponse[];
  loading: boolean;
  hasMore: boolean;
  currentRole?: Role;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onLoadMore: () => void;
};

function canDeletePet(role?: Role) {
  return role === "ADMIN" || role === "VET";
}

export function PetsTable({ pets, loading, hasMore, currentRole, onEdit, onDelete, onLoadMore }: Props) {
  const naming = useNaming();

  if (loading) return <div className={styles.state}>{naming.getLabel("loading")}</div>;
  if (!pets.length) return <div className={styles.state}>{naming.getMessage("noPetsFound")}</div>;

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
            <th>{naming.getLabel("tutor")}</th>
            <th>{naming.getLabel("species")}</th>
            <th>{naming.getLabel("status")}</th>
            <th className={styles.actionsCol}>{naming.getLabel("actions")}</th>
          </tr>
        </thead>

        <tbody>
          {pets.map((p) => {
            const canDelete = canDeletePet(currentRole);
            return (
              <tr key={p.id}>
                <td className={styles.nameCell}>{p.name}</td>
                <td className={styles.muted}>{p.tutorName ?? `#${p.tutorId}`}</td>
                <td className={styles.muted}>{naming.t(`species.${p.species}`)}</td>
                <td>
                  <PetStatusBadge active={p.active} />
                </td>
                <td className={styles.actions}>
                  <button className={styles.actionBtn} onClick={() => onEdit(p.id)} title={naming.getLabel("edit")}>
                    <PenIcon size={20} />
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.danger}`}
                    onClick={() => onDelete(p.id)}
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
