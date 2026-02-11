import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./TutorsPage.module.css";
import { TutorsTable } from "./components/TutorsTable";
import { TutorFormModal } from "./components/TutorFormModal";
import { useNaming } from "../../i18n/useNaming";

import { useConfirmStore } from "../../store/confirm.store";
import { useAuthStore } from "../../store/auth.store";
import type { Role, TutorListItemResponse } from "../../services/api/types";
import { deleteTutor, listTutors } from "../../services/api/tutors.service";
import { getApiErrorMessage } from "../../services/api/errors";
import { getMaxListItems } from "../../config/listMemory";

function canManageTutors(role?: Role) {
  return role === "ADMIN" || role === "VET" || role === "RECEPTION";
}

function canDeleteTutor(role?: Role) {
  return role === "ADMIN" || role === "VET";
}

export function TutorsPage() {
  const PAGE_SIZE = 15;
  const MAX_ITEMS_IN_MEMORY = getMaxListItems(PAGE_SIZE);
  const naming = useNaming();
  const me = useAuthStore((s) => s.me);
  const confirm = useConfirmStore((s) => s.confirm);

  const [loading, setLoading] = useState(false);
  const [tutors, setTutors] = useState<TutorListItemResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<{ open: boolean; tutorId?: number }>({ open: false });

  const myRole = me?.role;
  const allowed = useMemo(() => canManageTutors(myRole), [myRole]);
  const loadingRef = useRef(false);

  async function load(targetPage = page, targetQuery = query, append = false) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const normalizedQuery = targetQuery.trim();
      const response = await listTutors({
        page: targetPage,
        size: PAGE_SIZE,
        sort: "name,asc",
        query: normalizedQuery || undefined,
      });
      const content = response.content ?? [];
      setTutors((prev) => {
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

  useEffect(() => {
    document.title = `${naming.getTitle("tutors")} • ${naming.getApp("name")}`;
  }, [naming]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load(0, query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const hasMore = page + 1 < totalPages;

  async function handleDelete(id: number) {
    if (!canDeleteTutor(myRole)) return;

    const ok = await confirm({
      title: naming.getTitle("deleteTutor"),
      message: naming.getMessage("deleteTutorConfirm"),
      confirmText: naming.getLabel("delete"),
      cancelText: naming.getLabel("cancel"),
      danger: true,
    });
    if (!ok) return;

    try {
      await deleteTutor(id);
    } catch (error) {
      const apiMsg = getApiErrorMessage(error);
      console.log("Error deleting tutor:", error);
      await confirm({
        title: naming.getTitle("errorDeletingTutor"),
        message: apiMsg ?? (error instanceof Error ? error.message : naming.getMessage("unknown")),
        confirmText: naming.getLabel("ok"),
      });
      return;
    }
    await load(0, query);
  }

  async function handleLoadMore() {
    if (!hasMore || loading) return;
    await load(page + 1, query, true);
  }

  if (!allowed) {
    return (
      <div className={styles.page}>
        <div className={styles.denied}>
          <h1>{naming.getTitle("tutors")}</h1>
          <p>{naming.getMessage("permissionDeniedForAccess")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>{naming.getTitle("tutors")}</h1>
          <p className={styles.subtitle}>{naming.getMessage("manageTutors")}</p>
        </div>

        <div className={styles.headerRight}>
          <input
            className={styles.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={naming.getMessage("searchWithTutorNameDocPhone")}
            aria-label={naming.getMessage("searchTutors")}
          />

          <button className={styles.primaryBtn} onClick={() => setModal({ open: true })}>
            {naming.getTitle("newTutor")}
          </button>
        </div>
      </header>

      <section className={styles.card}>
        <TutorsTable
          tutors={tutors}
          loading={loading}
          hasMore={hasMore}
          currentRole={myRole}
          onEdit={(id) => setModal({ open: true, tutorId: id })}
          onDelete={handleDelete}
          onLoadMore={handleLoadMore}
        />
      </section>

      {modal.open && (
        <TutorFormModal
          tutorId={modal.tutorId}
          onClose={() => setModal({ open: false })}
          onSaved={async () => {
            setModal({ open: false });
            await load(0, query);
          }}
        />
      )}
    </div>
  );
}
