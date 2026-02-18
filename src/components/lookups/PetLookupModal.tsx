import { useEffect, useRef, useState } from "react";
import styles from "./PetLookupModal.module.css";
import { useNaming } from "../../i18n/useNaming";
import { listPets } from "../../services/api/pets.service";
import { listTutors } from "../../services/api/tutors.service";
import type { PetListItemResponse, TutorListItemResponse } from "../../services/api/types";

const PAGE_SIZE = 15;

export type PetLookupItem = {
  id: number;
  name: string;
  species: PetListItemResponse["species"];
  active: boolean;
  tutorId: number;
  tutorName?: string;
  tutorEmail?: string;
  tutorPhone?: string;
};

type Props = {
  onClose: () => void;
  onSelect: (pet: PetLookupItem) => void;
};

export function PetLookupModal({ onClose, onSelect }: Props) {
  const naming = useNaming();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PetLookupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [tutorsById, setTutorsById] = useState<Map<number, TutorListItemResponse>>(new Map());
  const loadingRef = useRef(false);

  async function loadTutors() {
    const response = await listTutors({
      page: 0,
      size: 500,
      sort: "name,asc",
      active: true,
    });
    const map = new Map<number, TutorListItemResponse>();
    (response.content ?? []).forEach((t) => map.set(t.id, t));
    setTutorsById(map);
  }

  async function load(targetPage = 0, targetQuery = query) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const response = await listPets({
        page: targetPage,
        size: PAGE_SIZE,
        sort: "name,asc",
        query: targetQuery.trim() || undefined,
        active: true,
      });
      const content = response.content ?? [];
      const enriched: PetLookupItem[] = content.map((p) => {
        const tutor = tutorsById.get(p.tutorId);
        return {
          id: p.id,
          name: p.name,
          species: p.species,
          active: p.active,
          tutorId: p.tutorId,
          tutorName: p.tutorName ?? tutor?.name,
          tutorEmail: tutor?.email,
          tutorPhone: tutor?.phone,
        };
      });

      setItems(enriched);
      setPage(response.number ?? targetPage);
      setTotalPages(response.totalPages ?? 0);
      setTotalElements(response.totalElements ?? 0);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }

  useEffect(() => {
    loadTutors();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(0, query), 250);
    return () => clearTimeout(timer);
  }, [query, tutorsById]);

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
          <div className={styles.title}>{naming.getMessage("appointmentsSelectPet")}</div>
        </div>

        <div className={styles.body}>
          <input
            className={styles.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={naming.getMessage("searchPets")}
            aria-label={naming.getMessage("searchPets")}
          />

          <div className={styles.tableWrap}>
            {loading && !items.length ? (
              <div className={styles.state}>{naming.getLabel("loading")}</div>
            ) : !items.length ? (
              <div className={styles.state}>{naming.getMessage("noPetsFound")}</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{naming.getTitle("pet")}</th>
                    <th>{naming.getLabel("species")}</th>
                    <th>{naming.getLabel("tutor")}</th>
                    <th>{naming.getLabel("email")}</th>
                    <th>{naming.getLabel("phone")}</th>
                    <th>{naming.getLabel("status")}</th>
                    <th className={styles.actions}>{naming.getLabel("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((pet) => (
                    <tr key={pet.id}>
                      <td className={styles.nameCell}>{pet.name}</td>
                      <td className={styles.muted}>{naming.t(`species.${pet.species}`)}</td>
                      <td>{pet.tutorName ?? "-"}</td>
                      <td className={styles.muted}>{pet.tutorEmail ?? "-"}</td>
                      <td className={styles.muted}>{pet.tutorPhone ?? "-"}</td>
                      <td>
                        <span className={`${styles.status} ${pet.active ? styles.statusActive : styles.statusInactive}`}>
                          {pet.active ? naming.getLabel("active") : naming.getLabel("inactive")}
                        </span>
                      </td>
                      <td className={styles.actions}>
                        <button className={styles.actionBtn} onClick={() => onSelect(pet)}>
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
            <button className={styles.btnGhost} onClick={() => goToPage(page - 1)} disabled={loading || page === 0}>
              {naming.getLabel("previous")}
            </button>
            <button className={styles.btnGhost} onClick={() => goToPage(page + 1)} disabled={loading || page + 1 >= totalPages}>
              {naming.getLabel("next")}
            </button>
          </div>

          <div className={styles.footer}>
            <button className={styles.btnGhost} onClick={onClose}>
              {naming.getLabel("cancel")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
