import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./AppointmentsPage.module.css";
import { PencilSimpleIcon, XCircleIcon } from "@phosphor-icons/react";
import { useNaming } from "../../i18n/useNaming";
import { useAuthStore } from "../../store/auth.store";
import { useConfirmStore } from "../../store/confirm.store";
import {
  assignAppointmentVet,
  cancelAppointment,
  createAppointment,
  listAppointments,
  updateAppointment,
} from "../../services/api/appointments.service";
import { listPets } from "../../services/api/pets.service";
import { listUsers } from "../../services/api/users.service";
import { listProducts } from "../../services/api/products.service";
import type {
  AppointmentResponse,
  AppointmentStatus,
  AppointmentType,
  OpenAppointmentRequest,
  Role,
  UpdateAppointmentRequest,
} from "../../services/api/types";
import { getApiErrorMessage } from "../../services/api/errors";
import { AppointmentFormModal } from "./components/AppointmentFormModal";
import { AppointmentStatusBadge } from "./components/AppointmentStatusBadge";
import { AppointmentTypeBadge } from "./components/AppointmentTypeBadge";
import { DateInputBR } from "../../components/DateInputBR/DateInputBR";

function canManageAppointments(role?: Role) {
  return role === "ADMIN" || role === "VET" || role === "RECEPTION";
}

function toDateInputValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  const local = new Date(date.getTime() - offsetMs);
  return local.toISOString().slice(0, 10);
}

function startOfDayIso(dateInput: string) {
  return new Date(`${dateInput}T00:00:00`).toISOString();
}

function endOfDayIso(dateInput: string) {
  return new Date(`${dateInput}T23:59:59`).toISOString();
}

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString("pt-BR");
  } catch {
    return value;
  }
}

export function AppointmentsPage() {
  const naming = useNaming();
  const confirm = useConfirmStore((s) => s.confirm);
  const me = useAuthStore((s) => s.me);
  const myRole = me?.role;
  const allowed = useMemo(() => canManageAppointments(myRole), [myRole]);

  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [pets, setPets] = useState<Array<{ id: number; name: string }>>([]);
  const [vets, setVets] = useState<Array<{ id: number; name: string }>>([]);
  const [services, setServices] = useState<Array<{ id: number; name: string }>>([]);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const today = toDateInputValue(new Date());
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "ALL">("OPEN");
  const [typeFilter, setTypeFilter] = useState<AppointmentType | "ALL">("ALL");

  const [assignVetByAppointment, setAssignVetByAppointment] = useState<Record<number, string>>({});
  const [modal, setModal] = useState<{ open: boolean; appointment?: AppointmentResponse }>({ open: false });

  const loadingRef = useRef(false);

  const petNameById = useMemo(() => new Map(pets.map((p) => [p.id, p.name])), [pets]);
  const vetNameById = useMemo(() => new Map(vets.map((v) => [v.id, v.name])), [vets]);
  const serviceNameById = useMemo(() => new Map(services.map((s) => [s.id, s.name])), [services]);

  async function showApiError(title: string, err: unknown) {
    await confirm({
      title,
      message: getApiErrorMessage(err) ?? (err instanceof Error ? err.message : naming.getMessage("unknown")),
      confirmText: naming.getLabel("ok"),
    });
  }

  async function loadAppointments(targetPage = page) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await listAppointments({
        page: targetPage,
        size: 20,
        sort: "scheduledStartAt,asc",
        scheduledFrom: startOfDayIso(dateFrom),
        scheduledTo: endOfDayIso(dateTo),
        status: statusFilter === "ALL" ? undefined : statusFilter,
        appointmentType: typeFilter === "ALL" ? undefined : typeFilter,
      });
      setAppointments(res.content ?? []);
      setPage(res.number ?? targetPage);
      setTotalPages(res.totalPages ?? 0);
    } catch (err) {
      await showApiError(naming.getMessage("appointmentsLoadErrorTitle"), err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }

  async function loadReferences() {
    try {
      const [petsRes, usersRes, productsRes] = await Promise.all([
        listPets({ page: 0, size: 300, sort: "name,asc", active: true }),
        listUsers({ page: 0, size: 300, sort: "name,asc" }),
        listProducts({ page: 0, size: 300, sort: "name,asc", active: true }),
      ]);

      setPets((petsRes.content ?? []).map((p) => ({ id: p.id, name: p.name })));
      setVets(
        (usersRes.content ?? [])
          .filter((u) => u.active && u.role === "VET")
          .map((u) => ({ id: u.id, name: u.name }))
      );

      // API de lista de produtos não retorna itemType; exibimos todos ativos.
      setServices((productsRes.content ?? []).map((p) => ({ id: p.id, name: p.name })));
    } catch (err) {
      await showApiError(naming.getMessage("appointmentsLoadErrorTitle"), err);
    }
  }

  useEffect(() => {
    document.title = `${naming.t("sidebar.appointments")} • ${naming.getApp("name")}`;
  }, [naming]);

  useEffect(() => {
    loadReferences();
  }, []);

  useEffect(() => {
    loadAppointments(0);
  }, [dateFrom, dateTo, statusFilter, typeFilter]);

  async function handleSaveAppointment(payload: OpenAppointmentRequest | UpdateAppointmentRequest, appointmentId?: number) {
    if (appointmentId) {
      await updateAppointment(appointmentId, payload as UpdateAppointmentRequest);
    } else {
      await createAppointment(payload as OpenAppointmentRequest);
    }
    setModal({ open: false });
    await loadAppointments(0);
  }

  async function handleAssignVet(appointmentId: number) {
    const vetId = Number(assignVetByAppointment[appointmentId] ?? "");
    if (!vetId) return;

    const ok = await confirm({
      title: naming.getMessage("appointmentsAssignVet"),
      message: naming.getMessage("appointmentsAssignVetConfirm"),
      confirmText: naming.getLabel("confirm"),
      cancelText: naming.getLabel("cancel"),
    });
    if (!ok) return;

    try {
      await assignAppointmentVet(appointmentId, vetId);
      await loadAppointments(page);
    } catch (err) {
      await showApiError(naming.getMessage("appointmentsSaveErrorTitle"), err);
    }
  }

  async function handleCancel(appointmentId: number) {
    const ok = await confirm({
      title: naming.getMessage("appointmentsCancel"),
      message: naming.getMessage("appointmentsCancelConfirm"),
      confirmText: naming.getLabel("confirm"),
      cancelText: naming.getLabel("cancel"),
      danger: true,
    });
    if (!ok) return;

    try {
      await cancelAppointment(appointmentId, naming.getMessage("appointmentsCanceledByUserReason"));
      await loadAppointments(page);
    } catch (err) {
      await showApiError(naming.getMessage("appointmentsSaveErrorTitle"), err);
    }
  }

  if (!allowed) {
    return (
      <div className={styles.page}>
        <div className={styles.denied}>
          <h1>{naming.t("sidebar.appointments")}</h1>
          <p>{naming.getMessage("permissionDeniedForAccess")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{naming.t("sidebar.appointments")}</h1>
          <p className={styles.subtitle}>{naming.getMessage("manageAppointments")}</p>
        </div>
        <button className={styles.primaryBtn} onClick={() => setModal({ open: true })}>
          {naming.getMessage("appointmentsNewSchedule")}
        </button>
      </header>

      <section className={styles.filtersCard}>
        <label>
          <span>{naming.getMessage("appointmentsDateFrom")}</span>
          <DateInputBR value={dateFrom} onChange={setDateFrom} ariaLabel={naming.getMessage("appointmentsDateFrom")} />
        </label>

        <label>
          <span>{naming.getMessage("appointmentsDateTo")}</span>
          <DateInputBR value={dateTo} onChange={setDateTo} ariaLabel={naming.getMessage("appointmentsDateTo")} />
        </label>

        <label>
          <span>{naming.getLabel("status")}</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | "ALL")}>
            <option value="ALL">{naming.getLabel("total")}</option>
            <option value="OPEN">{naming.getMessage("appointmentsStatusOpen")}</option>
            <option value="FINISHED">{naming.getMessage("appointmentsStatusFinished")}</option>
            <option value="CANCELED">{naming.getMessage("appointmentsStatusCanceled")}</option>
          </select>
        </label>

        <label>
          <span>{naming.getMessage("appointmentsType")}</span>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as AppointmentType | "ALL")}>
            <option value="ALL">{naming.getLabel("total")}</option>
            <option value="VET">{naming.getMessage("appointmentsTypeVet")}</option>
            <option value="PETSHOP">{naming.getMessage("appointmentsTypePetshop")}</option>
          </select>
        </label>
      </section>

      <section className={styles.card}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>{naming.getTitle("pet")}</th>
                <th>{naming.getMessage("appointmentsType")}</th>
                <th>{naming.getLabel("status")}</th>
                <th>{naming.getRole("VET")}</th>
                <th>{naming.getMessage("appointmentsService")}</th>
                <th>{naming.getMessage("appointmentsStartAt")}</th>
                <th>{naming.getLabel("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>{naming.getLabel("loading")}</td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={8}>{naming.getMessage("appointmentsNoData")}</td>
                </tr>
              ) : (
                appointments.map((a) => {
                  const isOpen = a.status === "OPEN";
                  const canEdit = isOpen;
                  const needsVetAssign = isOpen && a.appointmentType === "VET" && !a.veterinarianUserId;

                  return (
                    <tr key={a.id}>
                      <td>{a.id}</td>
                      <td>{petNameById.get(a.petId) ?? `#${a.petId}`}</td>
                      <td>
                        <AppointmentTypeBadge type={a.appointmentType} />
                      </td>
                      <td>
                        <AppointmentStatusBadge status={a.status} />
                      </td>
                      <td>{a.veterinarianUserId ? vetNameById.get(a.veterinarianUserId) ?? `#${a.veterinarianUserId}` : "-"}</td>
                      <td>{a.serviceProductId ? serviceNameById.get(a.serviceProductId) ?? `#${a.serviceProductId}` : "-"}</td>
                      <td>{formatDateTime(a.scheduledStartAt)}</td>
                      <td>
                        <div className={styles.inlineActions}>
                          {canEdit && (
                            <button
                              type="button"
                              className={styles.iconBtn}
                              title={naming.getLabel("edit")}
                              aria-label={naming.getLabel("edit")}
                              onClick={() => setModal({ open: true, appointment: a })}
                            >
                              <PencilSimpleIcon size={16} />
                            </button>
                          )}

                          {needsVetAssign && (
                            <>
                              <select
                                value={assignVetByAppointment[a.id] ?? ""}
                                onChange={(e) => setAssignVetByAppointment((s) => ({ ...s, [a.id]: e.target.value }))}
                              >
                                <option value="">{naming.getRole("VET")}</option>
                                {vets.map((v) => (
                                  <option key={v.id} value={v.id}>
                                    {v.name}
                                  </option>
                                ))}
                              </select>
                              <button type="button" onClick={() => handleAssignVet(a.id)}>
                                {naming.getMessage("appointmentsAssignVet")}
                              </button>
                            </>
                          )}

                          {isOpen && (
                            <button
                              type="button"
                              className={`${styles.iconBtn} ${styles.dangerBtn}`}
                              title={naming.getMessage("appointmentsCancel")}
                              aria-label={naming.getMessage("appointmentsCancel")}
                              onClick={() => handleCancel(a.id)}
                            >
                              <XCircleIcon size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.pager}>
          <button disabled={page <= 0 || loading} onClick={() => loadAppointments(page - 1)}>
            {naming.getLabel("previous")}
          </button>
          <span>
            {page + 1} / {Math.max(totalPages, 1)}
          </span>
          <button disabled={loading || page + 1 >= totalPages} onClick={() => loadAppointments(page + 1)}>
            {naming.getLabel("next")}
          </button>
        </div>
      </section>

      {modal.open && (
        <AppointmentFormModal
          appointment={modal.appointment}
          pets={pets}
          vets={vets}
          services={services}
          onClose={() => setModal({ open: false })}
          onSubmit={handleSaveAppointment}
        />
      )}
    </div>
  );
}
