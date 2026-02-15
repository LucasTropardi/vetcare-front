import { useEffect, useRef, useState } from "react";
import { listProducts } from "../../../services/api/products.service";
import type { ProductListItemResponse } from "../../../services/api/types";
import { useNaming } from "../../../i18n/useNaming";
import styles from "./ProductLookupModal.module.css";

type Props = {
  onClose: () => void;
  onSelect: (product: ProductListItemResponse) => void;
};

const PAGE_SIZE = 15;

export function ProductLookupModal({ onClose, onSelect }: Props) {
  const naming = useNaming();

  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ProductListItemResponse[]>([]);
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
      const response = await listProducts({
        page: targetPage,
        size: PAGE_SIZE,
        sort: "name,asc",
        name: targetQuery.trim() || undefined,
        active: true,
      });

      const content = response.content ?? [];
      setItems(content);
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

  function getVisiblePages() {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }
    const pages = new Set<number>([0, totalPages - 1, page - 1, page, page + 1]);
    if (page <= 2) pages.add(2);
    if (page >= totalPages - 3) pages.add(totalPages - 3);
    return Array.from(pages)
      .filter((p) => p >= 0 && p < totalPages)
      .sort((a, b) => a - b);
  }

  const displayPage = totalPages > 0 ? page + 1 : 0;

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.title}>{naming.getLabel("selectProduct")}</div>
          
        </div>

        <div className={styles.body}>
          <input
            className={styles.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={naming.getMessage("searchProducts")}
            aria-label={naming.getMessage("searchProducts")}
          />
          <div className={styles.hint}>{naming.getMessage("stockOnlyActiveProductsInPicker")}</div>

          <div className={styles.tableWrap}>
            {loading && !items.length ? (
              <div className={styles.state}>{naming.getLabel("loading")}</div>
            ) : !items.length ? (
              <div className={styles.state}>{naming.getMessage("noProductsFound")}</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{naming.getLabel("sku")}</th>
                    <th>{naming.getLabel("name")}</th>
                    <th>{naming.getLabel("productCategory")}</th>
                    <th>{naming.getLabel("status")}</th>
                    <th className={styles.actions}>{naming.getLabel("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((product) => (
                    <tr key={product.id}>
                      <td className={styles.muted}>{product.sku}</td>
                      <td className={styles.nameCell}>{product.name}</td>
                      <td className={styles.muted}>{naming.t(`productCategory.${product.category}`)}</td>
                      <td>
                        <span className={`${styles.status} ${product.active ? styles.statusActive : styles.statusInactive}`}>
                          {product.active ? naming.getLabel("active") : naming.getLabel("inactive")}
                        </span>
                      </td>
                      <td className={styles.actions}>
                        <button className={styles.actionBtn} onClick={() => onSelect(product)}>
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
            <button className={styles.btnGhost} onClick={() => goToPage(0)} disabled={loading || page === 0}>
              {"<<"}
            </button>
            <button className={styles.btnGhost} onClick={() => goToPage(page - 1)} disabled={loading || page === 0}>
              {naming.getLabel("previous")}
            </button>

            <div className={styles.pageNumbers}>
              {getVisiblePages().map((p, idx, arr) => (
                <div key={p} className={styles.pageNumberWrap}>
                  {idx > 0 && p - arr[idx - 1] > 1 && <span className={styles.ellipsis}>...</span>}
                  <button
                    className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`}
                    onClick={() => goToPage(p)}
                    disabled={loading}
                  >
                    {p + 1}
                  </button>
                </div>
              ))}
            </div>

            <button className={styles.btnGhost} onClick={() => goToPage(page + 1)} disabled={loading || page + 1 >= totalPages}>
              {naming.getLabel("next")}
            </button>
            <button className={styles.btnGhost} onClick={() => goToPage(totalPages - 1)} disabled={loading || page + 1 >= totalPages}>
              {">>"}
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
