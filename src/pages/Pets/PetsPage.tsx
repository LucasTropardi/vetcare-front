import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./PetsPage.module.css";
import { PetsTable } from "./components/PetsTable";
import { PetFormModal } from "./components/PetFormModal";
import {
  PetsStatsPanel,
  type PetSpeciesFilter,
  type PetStatusFilter,
} from "./components/PetsStatsPanel";
import { useNaming } from "../../i18n/useNaming";
import { useConfirmStore } from "../../store/confirm.store";
import { useAuthStore } from "../../store/auth.store";
import type { PetListItemResponse, PetStatsResponse, Role } from "../../services/api/types";
import { deletePet, getPetStats, listPets } from "../../services/api/pets.service";
import { getApiErrorMessage } from "../../services/api/errors";
import { getMaxListItems } from "../../config/listMemory";

function canManagePets(role?: Role) {
  return role === "ADMIN" || role === "VET" || role === "RECEPTION";
}

function canDeletePet(role?: Role) {
  return role === "ADMIN" || role === "VET";
}

export function PetsPage() {
  const PAGE_SIZE = 15;
  const MAX_ITEMS_IN_MEMORY = getMaxListItems(PAGE_SIZE);
  const naming = useNaming();
  const me = useAuthStore((s) => s.me);
  const confirm = useConfirmStore((s) => s.confirm);

  const [loading, setLoading] = useState(false);
  const [pets, setPets] = useState<PetListItemResponse[]>([]);
  const [stats, setStats] = useState<PetStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PetStatusFilter>("ALL");
  const [speciesFilter, setSpeciesFilter] = useState<PetSpeciesFilter>("ALL");
  const [modal, setModal] = useState<{ open: boolean; petId?: number }>({ open: false });

  const myRole = me?.role;
  const allowed = useMemo(() => canManagePets(myRole), [myRole]);
  const loadingRef = useRef(false);

  async function load(
    targetPage = page,
    targetQuery = query,
    targetStatusFilter = statusFilter,
    targetSpeciesFilter = speciesFilter,
    append = false
  ) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const normalizedQuery = targetQuery.trim();
      const response = await listPets({
        page: targetPage,
        size: PAGE_SIZE,
        sort: "name,asc",
        query: normalizedQuery || undefined,
        active: targetStatusFilter === "ACTIVE" ? true : targetStatusFilter === "INACTIVE" ? false : undefined,
        species: targetSpeciesFilter === "DOG" ? "DOG" : targetSpeciesFilter === "CAT" ? "CAT" : undefined,
        othersSpecies: targetSpeciesFilter === "OTHER" ? true : undefined,
      });
      const content = response.content ?? [];
      setPets((prev) => {
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
      const response = await getPetStats();
      setStats(response);
    } catch (error) {
      console.log("Error loading pet stats:", error);
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }

  useEffect(() => {
    document.title = `${naming.getTitle("pets")} • ${naming.getApp("name")}`;
  }, [naming]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load(0, query, statusFilter, speciesFilter);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, statusFilter, speciesFilter]);

  useEffect(() => {
    loadStats();
  }, []);

  const hasMore = page + 1 < totalPages;

  async function handleDelete(id: number) {
    if (!canDeletePet(myRole)) return;

    const ok = await confirm({
      title: naming.getTitle("deletePet"),
      message: naming.getMessage("deletePetConfirm"),
      confirmText: naming.getLabel("delete"),
      cancelText: naming.getLabel("cancel"),
      danger: true,
    });
    if (!ok) return;

    try {
      await deletePet(id);
    } catch (error) {
      const apiMsg = getApiErrorMessage(error);
      console.log("Error deleting pet:", error);
      await confirm({
        title: naming.getTitle("errorDeletingPet"),
        message: apiMsg ?? (error instanceof Error ? error.message : naming.getMessage("unknown")),
        confirmText: naming.getLabel("ok"),
      });
      return;
    }
    await Promise.all([load(0, query, statusFilter, speciesFilter), loadStats()]);
  }

  async function handleLoadMore() {
    if (!hasMore || loading) return;
    await load(page + 1, query, statusFilter, speciesFilter, true);
  }

  if (!allowed) {
    return (
      <div className={styles.page}>
        <div className={styles.denied}>
          <h1>{naming.getTitle("pets")}</h1>
          <p>{naming.getMessage("permissionDeniedForAccess")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>{naming.getTitle("pets")}</h1>
          <p className={styles.subtitle}>{naming.getMessage("managePets")}</p>
        </div>

        <div className={styles.headerRight}>
          <input
            className={styles.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={naming.getMessage("searchWithPetNameTutorSpecies")}
            aria-label={naming.getMessage("searchPets")}
          />

          <button className={styles.primaryBtn} onClick={() => setModal({ open: true })}>
            {naming.getTitle("newPet")}
          </button>
        </div>
      </header>

      <PetsStatsPanel
        stats={stats}
        loading={statsLoading}
        statusFilter={statusFilter}
        speciesFilter={speciesFilter}
        onResetFilters={() => {
          setStatusFilter("ALL");
          setSpeciesFilter("ALL");
        }}
        onStatusFilterChange={(filter) => {
          setStatusFilter((prev) => (prev === filter ? "ALL" : filter));
        }}
        onSpeciesFilterChange={(filter) => {
          setSpeciesFilter((prev) => (prev === filter ? "ALL" : filter));
        }}
      />

      <section className={styles.card}>
        <PetsTable
          pets={pets}
          loading={loading}
          hasMore={hasMore}
          currentRole={myRole}
          onEdit={(id) => setModal({ open: true, petId: id })}
          onDelete={handleDelete}
          onLoadMore={handleLoadMore}
        />
      </section>

      {modal.open && (
        <PetFormModal
          petId={modal.petId}
          onClose={() => setModal({ open: false })}
          onSaved={async () => {
            setModal({ open: false });
            await Promise.all([load(0, query, statusFilter, speciesFilter), loadStats()]);
          }}
        />
      )}
    </div>
  );
}
