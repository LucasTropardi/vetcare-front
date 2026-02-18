import { useEffect, useRef, useState } from "react";
import { useNaming } from "../../i18n/useNaming";
import { listTutors } from "../../services/api/tutors.service";
import type { TutorListItemResponse } from "../../services/api/types";
import styles from "./TutorLookupModal.module.css";

type Props = {
  onClose: () => void;
  onSelect: (tutor: TutorListItemResponse) => void;
};

const PAGE_SIZE = 15;

export function TutorLookupModal({ onClose, onSelect }: Props) {
  const naming = useNaming();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<TutorListItemResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const loadingRef = useRef(false);

  async function load(targetPage = 0, targetQuery = query) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const response = await listTutors({
        page: targetPage,
        size: PAGE_SIZE,
        sort: "name,asc",
        query: targetQuery.trim() || undefined,
        active: true,
      });
      setItems(response.content ?? []);
      setPage(response.number ?? targetPage);
      setTotalPages(response.totalPages ?? 0);
      setTotalElements(response.totalElements ?? 0);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => load(0, query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  async function goToPage(targetPage: number) {
    if (loading) return;
    if (targetPage < 0 || targetPage >= totalPages) return;
    await load(targetPage, query);
  }

  const displayPage = totalPages > 0 ? page + 1 : 0;

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.title}>{naming.getLabel("selectTutor")}</div>
        </div>

        <div className={styles.body}>
          <input
            className={styles.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={naming.getMessage("searchTutors")}
            aria-label={naming.getMessage("searchTutors")}
          />

          <div className={styles.tableWrap}>
            {loading && !items.length ? (
              <div className={styles.state}>{naming.getLabel("loading")}</div>
            ) : !items.length ? (
              <div className={styles.state}>{naming.getMessage("noTutorsFound")}</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{naming.getLabel("name")}</th>
                    <th>{naming.getLabel("document")}</th>
                    <th>{naming.getLabel("email")}</th>
                    <th>{naming.getLabel("phone")}</th>
                    <th>{naming.getLabel("status")}</th>
                    <th className={styles.actions}>{naming.getLabel("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((tutor) => (
                    <tr key={tutor.id}>
                      <td className={styles.nameCell}>{tutor.name}</td>
                      <td className={styles.muted}>{tutor.document ?? "-"}</td>
                      <td className={styles.muted}>{tutor.email ?? "-"}</td>
                      <td className={styles.muted}>{tutor.phone ?? "-"}</td>
                      <td>
                        <span className={`${styles.status} ${tutor.active ? styles.statusActive : styles.statusInactive}`}>
                          {tutor.active ? naming.getLabel("active") : naming.getLabel("inactive")}
                        </span>
                      </td>
                      <td className={styles.actions}>
                        <button type="button" className={styles.actionBtn} onClick={() => onSelect(tutor)}>
                          {naming.getLabel("select")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className={styles.paginationInfo}>
            {naming.getMessage("stockPickerPageInfo", {
              page: displayPage,
              totalPages,
              totalElements,
            })}
          </div>

          <div className={styles.pagination}>
            <button type="button" className={styles.btnGhost} onClick={() => goToPage(page - 1)} disabled={loading || page === 0}>
              {naming.getLabel("previous")}
            </button>
            <button
              type="button"
              className={styles.btnGhost}
              onClick={() => goToPage(page + 1)}
              disabled={loading || page + 1 >= totalPages}
            >
              {naming.getLabel("next")}
            </button>
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.btnGhost} onClick={onClose}>
              {naming.getLabel("cancel")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
