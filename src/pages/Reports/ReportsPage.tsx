import { useEffect, useMemo, useState } from "react";
import styles from "./ReportsPage.module.css";
import { useNaming } from "../../i18n/useNaming";
import { Naming } from "../../i18n/naming";
import { getApiErrorMessage } from "../../services/api/errors";
import { exportReport, listReportDefinitions, previewReport } from "../../services/api/reports.service";
import type {
  PdfOrientation,
  ReportColumnResponse,
  ReportDefinitionResponse,
  ReportFilterResponse,
  ReportFormat,
  ReportPreviewResponse,
} from "../../services/api/types";

export function ReportsPage() {
  const naming = useNaming();
  const [definitions, setDefinitions] = useState<ReportDefinitionResponse[]>([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<ReportPreviewResponse | null>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [format, setFormat] = useState<ReportFormat>("PDF");
  const [orientation, setOrientation] = useState<PdfOrientation>("LANDSCAPE");
  const [loadingDefinitions, setLoadingDefinitions] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `${naming.t("sidebar.reports")} • ${naming.getApp("name")}`;
  }, [naming]);

  useEffect(() => {
    loadDefinitions();
  }, []);

  const selectedDefinition = useMemo(
    () => definitions.find((d) => d.key === selectedKey) ?? null,
    [definitions, selectedKey]
  );

  async function loadDefinitions() {
    setLoadingDefinitions(true);
    setError(null);
    try {
      const data = await listReportDefinitions();
      setDefinitions(data);
      if (data.length > 0) {
        const first = data[0];
        setSelectedKey(first.key);
        setSelectedColumns(first.columns.map((c) => c.key));
        setFormat(first.formats[0] ?? "PDF");
      }
    } catch (err) {
      setError(getApiErrorMessage(err) ?? naming.getMessage("reportsLoadDefinitionsError"));
    } finally {
      setLoadingDefinitions(false);
    }
  }

  function handleDefinitionChange(nextKey: string) {
    setSelectedKey(nextKey);
    const definition = definitions.find((d) => d.key === nextKey);
    setSelectedColumns(definition?.columns.map((c) => c.key) ?? []);
    setFilters({});
    setPage(0);
    setPreview(null);
    setError(null);
    setFormat(definition?.formats[0] ?? "PDF");
  }

  function toggleColumn(columnKey: string) {
    setSelectedColumns((prev) => {
      if (prev.includes(columnKey)) {
        if (prev.length === 1) return prev;
        return prev.filter((key) => key !== columnKey);
      }
      return [...prev, columnKey];
    });
  }

  function setFilterValue(filterKey: string, value: string) {
    setFilters((prev) => ({ ...prev, [filterKey]: value }));
  }

  function buildPayload(nextPage: number) {
    const definition = selectedDefinition;
    if (!definition) return undefined;

    const parsedFilters: Record<string, unknown> = {};
    for (const filter of definition.filters) {
      const raw = (filters[filter.key] ?? "").trim();
      if (!raw) continue;

      if (filter.type === "BOOLEAN") {
        if (raw === "true") parsedFilters[filter.key] = true;
        else if (raw === "false") parsedFilters[filter.key] = false;
        continue;
      }

      if (filter.type === "NUMBER") {
        const parsed = Number(raw);
        if (!Number.isNaN(parsed)) parsedFilters[filter.key] = parsed;
        continue;
      }

      parsedFilters[filter.key] = raw;
    }

    return {
      filters: parsedFilters,
      columns: selectedColumns,
      page: nextPage,
      size,
    };
  }

  async function runPreview(nextPage = 0) {
    if (!selectedDefinition) return;
    setLoadingPreview(true);
    setError(null);
    try {
      const data = await previewReport(selectedDefinition.key, buildPayload(nextPage));
      setPreview(data);
      setPage(data.page);
    } catch (err) {
      setError(getApiErrorMessage(err) ?? naming.getMessage("reportsLoadPreviewError"));
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleExport() {
    if (!selectedDefinition) return;
    setExporting(true);
    setError(null);
    try {
      const { blob, filename } = await exportReport(selectedDefinition.key, format, orientation, {
        ...buildPayload(0),
        page: 0,
        size: 1000,
      });
      downloadBlob(blob, filename ?? `${selectedDefinition.key}.${format.toLowerCase()}`);
    } catch (err) {
      setError(getApiErrorMessage(err) ?? naming.getMessage("reportsExportError"));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{naming.t("sidebar.reportsCenter")}</h1>
        <p className={styles.subtitle}>{naming.getMessage("reportsCenterSubtitle")}</p>

        {loadingDefinitions && <p>{naming.getMessage("reportsLoadingDefinitions")}</p>}
        {error && <p className={styles.error}>{error}</p>}

        {!loadingDefinitions && definitions.length > 0 && (
          <>
            <section className={styles.section}>
              <label className={styles.label}>{naming.getMessage("reportsSectionReport")}</label>
              <select
                className={styles.input}
                value={selectedKey}
                onChange={(e) => handleDefinitionChange(e.target.value)}
              >
                {definitions.map((definition) => (
                  <option key={definition.key} value={definition.key}>
                    {definition.title}
                  </option>
                ))}
              </select>
              <p className={styles.hint}>{selectedDefinition?.description}</p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>{naming.getMessage("reportsSectionFilters")}</h2>
              <div className={styles.filtersGrid}>
                {selectedDefinition?.filters.map((filter) => (
                  <FilterField
                    key={filter.key}
                    filter={filter}
                    value={filters[filter.key] ?? ""}
                    naming={naming}
                    onChange={(value) => setFilterValue(filter.key, value)}
                  />
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>{naming.getMessage("reportsSectionColumns")}</h2>
              <div className={styles.columnsGrid}>
                {selectedDefinition?.columns.map((column) => (
                  <label key={column.key} className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(column.key)}
                      onChange={() => toggleColumn(column.key)}
                    />
                    <span>{column.label}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.actions}>
                <button className={styles.primaryBtn} onClick={() => runPreview(0)} disabled={loadingPreview}>
                  {loadingPreview ? naming.getMessage("loading") : naming.getMessage("reportsGeneratePreview")}
                </button>

                <select
                  className={styles.input}
                  value={format}
                  onChange={(e) => setFormat(e.target.value as ReportFormat)}
                >
                  {(selectedDefinition?.formats ?? []).map((fmt) => (
                    <option key={fmt} value={fmt}>
                      {fmt}
                    </option>
                  ))}
                </select>

                {format === "PDF" && (
                  <select
                    className={styles.input}
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as PdfOrientation)}
                  >
                    <option value="LANDSCAPE">{naming.getMessage("reportsOrientationLandscape")}</option>
                    <option value="PORTRAIT">{naming.getMessage("reportsOrientationPortrait")}</option>
                  </select>
                )}

                <button className={styles.secondaryBtn} onClick={handleExport} disabled={exporting}>
                  {exporting ? naming.getMessage("reportsExporting") : naming.getMessage("reportsExport")}
                </button>
              </div>
            </section>

            {preview && (
              <section className={styles.section}>
                <div className={styles.previewHeader}>
                  <h2 className={styles.sectionTitle}>{naming.getMessage("reportsPreviewTitle")}</h2>
                  <div className={styles.pager}>
                    <button
                      className={styles.secondaryBtn}
                      onClick={() => runPreview(page - 1)}
                      disabled={page <= 0 || loadingPreview}
                    >
                      {naming.getLabel("previous")}
                    </button>
                    <span>
                      {naming.getMessage("reportsPageInfo", {
                        page: preview.page + 1,
                        totalPages: Math.max(preview.totalPages, 1),
                      })}
                    </span>
                    <button
                      className={styles.secondaryBtn}
                      onClick={() => runPreview(page + 1)}
                      disabled={page + 1 >= preview.totalPages || loadingPreview}
                    >
                      {naming.getLabel("next")}
                    </button>
                    <select
                      className={styles.input}
                      value={String(size)}
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        setSize(next);
                        setPage(0);
                      }}
                    >
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                </div>

                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        {preview.columns.map((column: ReportColumnResponse) => (
                          <th key={column.key}>{column.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.length === 0 && (
                        <tr>
                          <td colSpan={preview.columns.length || 1}>{naming.getMessage("reportsNoData")}</td>
                        </tr>
                      )}
                      {preview.rows.map((row, index) => (
                        <tr key={index}>
                          {preview.columns.map((column: ReportColumnResponse) => (
                            <td key={column.key}>{formatCell(row[column.key], naming)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FilterField({
  filter,
  value,
  naming,
  onChange,
}: {
  filter: ReportFilterResponse;
  value: string;
  naming: typeof Naming;
  onChange: (value: string) => void;
}) {
  if (filter.type === "BOOLEAN") {
    return (
      <label className={styles.field}>
        <span className={styles.label}>{filter.label}</span>
        <select className={styles.input} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">{naming.getLabel("all")}</option>
          <option value="true">{naming.getLabel("yes")}</option>
          <option value="false">{naming.getLabel("no")}</option>
        </select>
      </label>
    );
  }

  if (filter.type === "SELECT") {
    return (
      <label className={styles.field}>
        <span className={styles.label}>{filter.label}</span>
        <select className={styles.input} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">{naming.getLabel("all")}</option>
          {(filter.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className={styles.field}>
      <span className={styles.label}>{filter.label}</span>
      <input
        className={styles.input}
        type={filter.type === "NUMBER" ? "number" : "text"}
        value={value}
        placeholder={filter.placeholder ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function formatCell(value: unknown, naming: typeof Naming) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? naming.getLabel("yes") : naming.getLabel("no");
  return String(value);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
