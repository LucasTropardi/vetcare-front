import styles from "./UsersTable.module.css";

import { RoleBadge } from "./RoleBadge";
import { UserStatusBadge } from "./UserStatusBadge";
import type { Role, UserResponseWithRole } from "../../../services/api/types";
import { useNaming } from "../../../i18n/useNaming"; 
import { PauseIcon, PenIcon, PlayIcon, TrashIcon } from "@phosphor-icons/react";

type Props = {
  users: UserResponseWithRole[];
  loading: boolean;
  currentRole?: Role;
  onEdit: (id: number) => void;
  onDelete: (id: number, targetRole?: Role) => void;
  onToggleActive: (user: UserResponseWithRole) => void;
  canEditTarget: (current?: Role, target?: Role) => boolean;
};

export function UsersTable({
  users,
  loading,
  currentRole,
  onEdit,
  onDelete,
  onToggleActive,
  canEditTarget,
}: Props) {
  const naming = useNaming();
  if (loading) return <div className={styles.state}>{naming.getLabel("loading")}</div>;
  if (!users.length) return <div className={styles.state}>{naming.getMessage("noUsersFound")}</div>;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{naming.getLabel("name")}</th>
            <th>{naming.getLabel("email")}</th>
            <th>{naming.getLabel("role")}</th>
            <th>{naming.getLabel("status")}</th>
            <th className={styles.actionsCol}>{naming.getLabel("actions")}</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => {
            const canEdit = canEditTarget(currentRole, u.role);

            return (
              <tr key={u.id}>
                <td className={styles.nameCell}>{u.name}</td>
                <td className={styles.muted}>{u.email}</td>
                <td>
                  <RoleBadge role={u.role} />
                </td>
                <td>
                  <UserStatusBadge active={u.active} />
                </td>
                <td className={styles.actions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => onEdit(u.id)}
                    disabled={!canEdit}
                    title={!canEdit ? naming.getMessage("noPermissionEditUser") : naming.getLabel("edit")}
                  >
                    <PenIcon size={20} />
                  </button>

                  <button
                    className={styles.actionBtn}
                    onClick={() => onToggleActive(u)}
                    disabled={!canEdit}
                    title={!canEdit ? naming.getMessage("noPermission") : u.active ? naming.getLabel("deactivate") : naming.getLabel("activate")}
                  >
                    {u.active ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
                  </button>

                  <button
                    className={`${styles.actionBtn} ${styles.danger}`}
                    onClick={() => onDelete(u.id, u.role)}
                    disabled={!canEdit}
                    title={!canEdit ? naming.getMessage("noPermission") : naming.getLabel("delete")}
                  >
                    <TrashIcon size={20} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
