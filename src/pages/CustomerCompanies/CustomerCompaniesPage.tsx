import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./CustomerCompaniesPage.module.css";
import { useNaming } from "../../i18n/useNaming";
import { useConfirmStore } from "../../store/confirm.store";
import { useAuthStore } from "../../store/auth.store";
import type { CustomerCompanyListItemResponse, CustomerCompanyStatsResponse, Role } from "../../services/api/types";
import {
  deleteCustomerCompany,
  getCustomerCompanyStats,
  listCustomerCompanies,
} from "../../services/api/customer-companies.service";
import { getApiErrorMessage } from "../../services/api/errors";
import { getMaxListItems } from "../../config/listMemory";
import {
  CustomerCompaniesStatsPanel,
  type CustomerCompanyInsightFilter,
  type CustomerCompanyStatusFilter,
} from "./components/CustomerCompaniesStatsPanel";
import { CustomerCompaniesTable } from "./components/CustomerCompaniesTable";
import { CustomerCompanyFormModal } from "./components/CustomerCompanyFormModal";

function canManageCustomerCompanies(role?: Role) {
  return role === "ADMIN" || role === "VET" || role === "RECEPTION";
}

function canDeleteCustomerCompany(role?: Role) {
  return role === "ADMIN" || role === "VET";
}

export function CustomerCompaniesPage() {
  const PAGE_SIZE = 15;
  const MAX_ITEMS_IN_MEMORY = getMaxListItems(PAGE_SIZE);
  const naming = useNaming();
  const me = useAuthStore((s) => s.me);
  const confirm = useConfirmStore((s) => s.confirm);

  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<CustomerCompanyListItemResponse[]>([]);
  const [stats, setStats] = useState<CustomerCompanyStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerCompanyStatusFilter>("ALL");
  const [insightFilter, setInsightFilter] = useState<CustomerCompanyInsightFilter>("ALL");
  const [modal, setModal] = useState<{ open: boolean; companyId?: number }>({ open: false });

  const myRole = me?.role;
  const allowed = useMemo(() => canManageCustomerCompanies(myRole), [myRole]);
  const loadingRef = useRef(false);

  async function load(
    targetPage = page,
    targetQuery = query,
    targetStatusFilter = statusFilter,
    targetInsightFilter = insightFilter,
    append = false
  ) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const normalizedQuery = targetQuery.trim();
      const response = await listCustomerCompanies({
        page: targetPage,
        size: PAGE_SIZE,
        sort: "legalName,asc",
        query: normalizedQuery || undefined,
        active: targetStatusFilter === "ACTIVE" ? true : targetStatusFilter === "INACTIVE" ? false : undefined,
        hasAddress: targetInsightFilter === "WITH_ADDRESS" ? true : undefined,
        hasFiscal: targetInsightFilter === "WITH_FISCAL" ? true : undefined,
        hasContact: targetInsightFilter === "WITHOUT_CONTACT" ? false : undefined,
      });
      const content = response.content ?? [];
      setCompanies((prev) => {
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
      const response = await getCustomerCompanyStats();
      setStats(response);
    } catch (error) {
      console.log("Error loading customer company stats:", error);
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }

  useEffect(() => {
    document.title = `${naming.getTitle("customerCompanies")} • ${naming.getApp("name")}`;
  }, [naming]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load(0, query, statusFilter, insightFilter);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, statusFilter, insightFilter]);

  useEffect(() => {
    loadStats();
  }, []);

  const hasMore = page + 1 < totalPages;

  async function handleDelete(id: number) {
    if (!canDeleteCustomerCompany(myRole)) return;

    const ok = await confirm({
      title: naming.getTitle("deleteCustomerCompany"),
      message: naming.getMessage("deleteCustomerCompanyConfirm"),
      confirmText: naming.getLabel("delete"),
      cancelText: naming.getLabel("cancel"),
      danger: true,
    });
    if (!ok) return;

    try {
      await deleteCustomerCompany(id);
    } catch (error) {
      const apiMsg = getApiErrorMessage(error);
      console.log("Error deleting customer company:", error);
      await confirm({
        title: naming.getTitle("errorDeletingCustomerCompany"),
        message: apiMsg ?? (error instanceof Error ? error.message : naming.getMessage("unknown")),
        confirmText: naming.getLabel("ok"),
      });
      return;
    }

    await Promise.all([load(0, query, statusFilter, insightFilter), loadStats()]);
  }

  async function handleLoadMore() {
    if (!hasMore || loading) return;
    await load(page + 1, query, statusFilter, insightFilter, true);
  }

  if (!allowed) {
    return (
      <div className={styles.page}>
        <div className={styles.denied}>
          <h1>{naming.getTitle("customerCompanies")}</h1>
          <p>{naming.getMessage("permissionDeniedForAccess")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>{naming.getTitle("customerCompanies")}</h1>
          <p className={styles.subtitle}>{naming.getMessage("manageCustomerCompanies")}</p>
        </div>

        <div className={styles.headerRight}>
          <input
            className={styles.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={naming.getMessage("searchWithCompanyNameTradeCnpj")}
            aria-label={naming.getMessage("searchCustomerCompanies")}
          />

          <button className={styles.primaryBtn} onClick={() => setModal({ open: true })}>
            {naming.getTitle("newCustomerCompany")}
          </button>
        </div>
      </header>

      <CustomerCompaniesStatsPanel
        stats={stats}
        loading={statsLoading}
        statusFilter={statusFilter}
        insightFilter={insightFilter}
        onResetFilters={() => {
          setStatusFilter("ALL");
          setInsightFilter("ALL");
        }}
        onStatusFilterChange={(filter) => {
          setStatusFilter((prev) => (prev === filter ? "ALL" : filter));
        }}
        onInsightFilterChange={(filter) => {
          setInsightFilter((prev) => (prev === filter ? "ALL" : filter));
        }}
      />

      <section className={styles.card}>
        <CustomerCompaniesTable
          companies={companies}
          loading={loading}
          hasMore={hasMore}
          currentRole={myRole}
          onEdit={(id) => setModal({ open: true, companyId: id })}
          onDelete={handleDelete}
          onLoadMore={handleLoadMore}
        />
      </section>

      {modal.open && (
        <CustomerCompanyFormModal
          companyId={modal.companyId}
          onClose={() => setModal({ open: false })}
          onSaved={async () => {
            setModal({ open: false });
            await Promise.all([load(0, query, statusFilter, insightFilter), loadStats()]);
          }}
        />
      )}
    </div>
  );
}
