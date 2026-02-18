import { useMemo, useState } from "react";
import styles from "./ServiceLookupModal.module.css";
import { useNaming } from "../../i18n/useNaming";

type ServiceOption = {
  id: number;
  name: string;
};

type Props = {
  services: ServiceOption[];
  onClose: () => void;
  onSelect: (service: ServiceOption) => void;
};

export function ServiceLookupModal({ services, onClose, onSelect }: Props) {
  const naming = useNaming();
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => s.name.toLowerCase().includes(q) || String(s.id).includes(q));
  }, [services, query]);

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.title}>{naming.getMessage("appointmentsSelectService")}</div>
        </div>

        <div className={styles.body}>
          <input
            className={styles.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={naming.getMessage("appointmentsSearchService")}
            aria-label={naming.getMessage("appointmentsSearchService")}
          />

          <div className={styles.tableWrap}>
            {!items.length ? (
              <div className={styles.state}>{naming.getMessage("appointmentsNoServiceFound")}</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>{naming.getMessage("appointmentsService")}</th>
                    <th className={styles.actions}>{naming.getLabel("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((service) => (
                    <tr key={service.id}>
                      <td className={styles.muted}>{service.id}</td>
                      <td className={styles.nameCell}>{service.name}</td>
                      <td className={styles.actions}>
                        <button type="button" className={styles.actionBtn} onClick={() => onSelect(service)}>
                          {naming.getLabel("select")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
