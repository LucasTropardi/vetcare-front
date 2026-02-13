import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./UsersPage.module.css";
import { UsersTable } from "./components/UsersTable";
import { UserFormModal } from "./components/UserFormModal";
import { UsersStatsPanel, type UsersRoleFilter, type UsersStatusFilter } from "./components/UsersStatsPanel";
import { useNaming } from "../../i18n/useNaming";

import { useConfirmStore } from "../../store/confirm.store";
import { useAuthStore } from "../../store/auth.store";
import type { Role, UserResponseWithRole, UserStatsResponse } from "../../services/api/types";
import { deleteUser, getUserStats, listUsers, updateUser } from "../../services/api/users.service";
import { getApiErrorMessage } from "../../services/api/errors";
import { getMaxListItems } from "../../config/listMemory";

function canManageUsers(role?: Role) {
  return role === "ADMIN" || role === "VET";
}

function canEditTarget(current?: Role, target?: Role) {
  if (current === "ADMIN") return true;
  if (current === "VET") return target !== "ADMIN";
  return false;
}

export function UsersPage() {
  const PAGE_SIZE = 15;
  const MAX_ITEMS_IN_MEMORY = getMaxListItems(PAGE_SIZE);
  const naming = useNaming();
  const me = useAuthStore((s) => s.me);
  const confirm = useConfirmStore((s) => s.confirm);

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserResponseWithRole[]>([]);
  const [stats, setStats] = useState<UserStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<UsersStatusFilter>("ALL");
  const [roleFilter, setRoleFilter] = useState<UsersRoleFilter>("ALL");
  const [modal, setModal] = useState<{ open: boolean; userId?: number }>({ open: false });

  const myRole = me?.role;
  const allowed = useMemo(() => canManageUsers(myRole), [myRole]);
  const loadingRef = useRef(false);

  async function load(targetPage = page, append = false) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const response = await listUsers({ page: targetPage, size: PAGE_SIZE, sort: "name,asc" });
      const content = response.content ?? [];
      setUsers((prev) => {
        if (!append) return content;
        const merged = [...prev, ...content];
        if (merged.length <= MAX_ITEMS_IN_MEMORY) return merged;
        return merged.slice(merged.length - MAX_ITEMS_IN_MEMORY);
      });
      setPage(response.number ?? targetPage);
      setTotalPages(response.totalPages ?? 0);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }

  async function loadStats() {
    setStatsLoading(true);
    try {
      const response = await getUserStats();
      setStats(response);
    } catch (error) {
      console.log("Error loading user stats:", error);
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }

  useEffect(() => {
    document.title = `${naming.getTitle("users")} • ${naming.getApp("name")}`;
  }, [naming]);

  useEffect(() => {
    load(0);
    loadStats();
  }, []);

  const hasMore = page + 1 < totalPages;

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (statusFilter === "ACTIVE" && !u.active) return false;
      if (statusFilter === "INACTIVE" && u.active) return false;
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (!q) return true;
      const hay = `${u.name} ${u.email} ${u.role}`.toLowerCase();
      return hay.includes(q);
    });
  }, [users, query, roleFilter, statusFilter]);

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
    await Promise.all([load(0), loadStats()]);
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
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, active: !user.active } : u)));
    await loadStats();
  }

  async function handleLoadMore() {
    if (!hasMore || loading) return;
    await load(page + 1, true);
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

      <UsersStatsPanel
        stats={stats}
        loading={statsLoading}
        statusFilter={statusFilter}
        roleFilter={roleFilter}
        onResetFilters={() => {
          setStatusFilter("ALL");
          setRoleFilter("ALL");
        }}
        onStatusFilterChange={(filter) => {
          setStatusFilter((prev) => (prev === filter ? "ALL" : filter));
        }}
        onRoleFilterChange={(filter) => {
          setRoleFilter((prev) => (prev === filter ? "ALL" : filter));
        }}
      />

      <section className={styles.card}>
        <UsersTable
          users={filteredUsers}
          loading={loading}
          hasMore={hasMore}
          currentRole={myRole}
          onEdit={(id) => setModal({ open: true, userId: id })}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          onLoadMore={handleLoadMore}
          canEditTarget={canEditTarget}
        />
      </section>

      {modal.open && (
        <UserFormModal
          userId={modal.userId}
          onClose={() => setModal({ open: false })}
          onSaved={async () => {
            setModal({ open: false });
            await Promise.all([load(0), loadStats()]);
          }}
          currentRole={myRole}
          canEditTarget={canEditTarget}
        />
      )}
    </div>
  );
}
