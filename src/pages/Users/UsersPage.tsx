import { useEffect, useMemo, useState } from "react";
import styles from "./UsersPage.module.css";
import { UsersTable } from "./components/UsersTable";
import { UserFormModal } from "./components/UserFormModal";
import { useNaming } from "../../i18n/useNaming";

import { useConfirmStore } from "../../store/confirm.store";
import { useAuthStore } from "../../store/auth.store";
import type { Role, UserResponseWithRole } from "../../services/api/types";
import { deleteUser, listUsers, updateUser } from "../../services/api/users.service";
import { getApiErrorMessage } from "../../services/api/errors";

function canManageUsers(role?: Role) {
  return role === "ADMIN" || role === "VET";
}

function canEditTarget(current?: Role, target?: Role) {
  if (current === "ADMIN") return true;
  if (current === "VET") return target !== "ADMIN";
  return false;
}

export function UsersPage() {
  const naming = useNaming();
  const me = useAuthStore((s) => s.me);
  const confirm = useConfirmStore((s) => s.confirm);

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserResponseWithRole[]>([]);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<{ open: boolean; userId?: number }>({ open: false });

  const myRole = me?.role;
  const allowed = useMemo(() => canManageUsers(myRole), [myRole]);

  async function load() {
    setLoading(true);
    try {
      const page = await listUsers({ page: 0, size: 50, sort: "name,asc" });
      setUsers(page.content ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = `${naming.getTitle("users")} • ${naming.getApp("name")}`;
  }, [naming]);

  useEffect(() => {
    load();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const hay = `${u.name} ${u.email} ${u.role}`.toLowerCase();
      return hay.includes(q);
    });
  }, [users, query]);

  async function handleDelete(id: number, targetRole?: Role) {
    if (!canEditTarget(myRole, targetRole)) return;

    const ok = await confirm({
      title: naming.getTitle("deleteUser"),
      message: naming.getMessage("deleteUserConfirm"),
      confirmText: naming.getLabel("delete"),
      cancelText: naming.getLabel("cancel"),
      danger: true,
    });
    if (!ok) return;

    try {
      await deleteUser(id);
    } catch (error) {
      const apiMsg = getApiErrorMessage(error);
      console.log("Error deleting user:", error);
      await confirm({
        title: naming.getTitle("errorDeletingUser"),
        message: apiMsg ?? (error instanceof Error ? error.message : naming.getMessage("unknown")),
        confirmText: naming.getLabel("ok"),
      });
      return;
    }
    await load();
  }

  async function handleToggleActive(user: UserResponseWithRole) {
    if (!canEditTarget(myRole, user.role)) return;

    if (user.id === me?.id) {
      await confirm({
        title: naming.getTitle("forbidenAction"),
        message: naming.getMessage("youCannotActivateDeactivateYourself"),
        confirmText: naming.getLabel("ok"),
      });
      return;
    }

    const action = user.active ? naming.getAction("deactivateUser") : naming.getAction("activateUser");
    const ok = await confirm({
      title: `${action[0].toUpperCase()}${action.slice(1)} usuário`,
      message: `${naming.getMessage("areYouSure")} ${action} "${user.name}"?`,
      confirmText: user.active ? "Desativar" : "Ativar",
      cancelText: "Cancelar",
      danger: user.active,
    });
    if (!ok) return;

    try {
      await updateUser(user.id, { active: !user.active });
    } catch (error) {
      const apiMsg = getApiErrorMessage(error);
      console.log("Error updating user status:", error);
      await confirm({
        title: naming.getTitle("errorUpdatingUserStatus"),
        message: apiMsg ?? (error instanceof Error ? error.message : naming.getMessage("unknown")),
        confirmText: naming.getLabel("ok"),
      });
      return;
    }
    await load();
  }

  if (!allowed) {
    return (
      <div className={styles.page}>
        <div className={styles.denied}>
          <h1>{naming.getTitle("users")}</h1>
          <p>{naming.getMessage("permissionDeniedForAccess")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>{naming.getTitle("users")}</h1>
          <p className={styles.subtitle}>{naming.getMessage("manageSystemUsers")}</p>
        </div>

        <div className={styles.headerRight}>
          <input
            className={styles.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={naming.getMessage("searchWithUserMailRole")}
            aria-label={naming.getMessage("searchUsers")}
          />

          <button className={styles.primaryBtn} onClick={() => setModal({ open: true })}>
            {naming.getTitle("newUser")}
          </button>
        </div>
      </header>

      <section className={styles.card}>
        <UsersTable
          users={filteredUsers}
          loading={loading}
          currentRole={myRole}
          onEdit={(id) => setModal({ open: true, userId: id })}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          canEditTarget={canEditTarget}
        />
      </section>

      {modal.open && (
        <UserFormModal
          userId={modal.userId}
          onClose={() => setModal({ open: false })}
          onSaved={async () => {
            setModal({ open: false });
            await load();
          }}
          currentRole={myRole}
          canEditTarget={canEditTarget}
        />
      )}
    </div>
  );
}
