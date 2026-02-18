import { useMemo, useState, type FormEvent } from "react";
import styles from "./AppointmentFormModal.module.css";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useNaming } from "../../../i18n/useNaming";
import { useConfirmStore } from "../../../store/confirm.store";
import { PetLookupModal, type PetLookupItem } from "../../../components/lookups/PetLookupModal";
import { ServiceLookupModal } from "../../../components/lookups/ServiceLookupModal";
import type {
  AppointmentResponse,
  AppointmentType,
  OpenAppointmentRequest,
  UpdateAppointmentRequest,
} from "../../../services/api/types";

type Option = { id: number; name: string };

type Props = {
  appointment?: AppointmentResponse;
  pets: Option[];
  vets: Option[];
  services: Option[];
  onClose: () => void;
  onSubmit: (payload: OpenAppointmentRequest | UpdateAppointmentRequest, appointmentId?: number) => Promise<void>;
};

function toLocalDateTimeInputValue(iso: string) {
  const date = new Date(iso);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  const local = new Date(date.getTime() - offsetMs);
  return local.toISOString().slice(0, 16);
}

function toIsoFromDateTimeInput(value: string) {
  return new Date(value).toISOString();
}

export function AppointmentFormModal({ appointment, pets, vets, services, onClose, onSubmit }: Props) {
  const naming = useNaming();
  const confirm = useConfirmStore((s) => s.confirm);
  const isEdit = !!appointment;

  const initialStart = appointment ? toLocalDateTimeInputValue(appointment.scheduledStartAt) : toLocalDateTimeInputValue(new Date().toISOString());
  const initialDuration = appointment
    ? String(Math.max(1, Math.round((new Date(appointment.scheduledEndAt).getTime() - new Date(appointment.scheduledStartAt).getTime()) / 60000)))
    : "30";

  const [saving, setSaving] = useState(false);
  const [petLookupOpen, setPetLookupOpen] = useState(false);
  const [serviceLookupOpen, setServiceLookupOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<PetLookupItem | null>(null);
  const [selectedServiceName, setSelectedServiceName] = useState<string | null>(null);
  const [form, setForm] = useState({
    appointmentType: (appointment?.appointmentType ?? "VET") as AppointmentType,
    petId: appointment ? String(appointment.petId) : "",
    veterinarianUserId: appointment?.veterinarianUserId ? String(appointment.veterinarianUserId) : "",
    serviceProductId: appointment?.serviceProductId ? String(appointment.serviceProductId) : "",
    scheduledStartAt: initialStart,
    durationMinutes: initialDuration,
    notes: appointment?.notes ?? "",
    chiefComplaint: "",
  });

  const canSubmit = useMemo(() => {
    if (!form.petId) return false;
    const duration = Number(form.durationMinutes);
    if (!Number.isFinite(duration) || duration <= 0) return false;
    if (form.appointmentType === "PETSHOP" && !form.serviceProductId) return false;
    return true;
  }, [form]);

  const selectedPetLabel = useMemo(() => {
    if (selectedPet) {
      return `${selectedPet.name}${selectedPet.tutorName ? ` • ${selectedPet.tutorName}` : ""}`;
    }
    const existingPet = pets.find((p) => String(p.id) === form.petId);
    return existingPet?.name ?? "";
  }, [selectedPet, pets, form.petId]);

  const selectedServiceLabel = useMemo(() => {
    if (selectedServiceName) return selectedServiceName;
    const existingService = services.find((service) => String(service.id) === form.serviceProductId);
    return existingService?.name ?? "";
  }, [selectedServiceName, services, form.serviceProductId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    const ok = await confirm({
      title: isEdit ? naming.getMessage("saveChanges") : naming.getMessage("appointmentsCreate"),
      message: isEdit ? naming.getMessage("appointmentsEditConfirm") : naming.getMessage("appointmentsCreateConfirm"),
      confirmText: naming.getLabel("confirm"),
      cancelText: naming.getLabel("cancel"),
    });
    if (!ok) return;

    const startAt = toIsoFromDateTimeInput(form.scheduledStartAt);
    const duration = Number(form.durationMinutes);
    const endAt = new Date(new Date(startAt).getTime() + duration * 60_000).toISOString();

    const payload: OpenAppointmentRequest | UpdateAppointmentRequest = {
      ...(isEdit ? {} : { petId: Number(form.petId) }),
      appointmentType: form.appointmentType,
      veterinarianUserId: form.appointmentType === "VET" && form.veterinarianUserId ? Number(form.veterinarianUserId) : undefined,
      serviceProductId: form.appointmentType === "PETSHOP" && form.serviceProductId ? Number(form.serviceProductId) : undefined,
      scheduledStartAt: startAt,
      scheduledEndAt: endAt,
      notes: form.notes.trim() || undefined,
      chiefComplaint: form.appointmentType === "VET" ? form.chiefComplaint.trim() || undefined : undefined,
    };

    setSaving(true);
    try {
      await onSubmit(payload, appointment?.id);
    } catch (error) {
      await confirm({
        title: naming.getMessage("appointmentsSaveErrorTitle"),
        message: error instanceof Error ? error.message : naming.getMessage("unknown"),
        confirmText: naming.getLabel("ok"),
      });
      return;
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className={styles.backdrop} role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className={styles.panel}>
          <div className={styles.header}>
            <div className={styles.title}>{isEdit ? naming.getMessage("appointmentsEditTitle") : naming.getMessage("appointmentsNewSchedule")}</div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.grid}>
            <label className={styles.field}>
              <span>{naming.getMessage("appointmentsType")}</span>
              <select
                value={form.appointmentType}
                onChange={(e) => setForm((s) => ({ ...s, appointmentType: e.target.value as AppointmentType }))}
              >
                <option value="VET">{naming.getMessage("appointmentsTypeVet")}</option>
                <option value="PETSHOP">{naming.getMessage("appointmentsTypePetshop")}</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>{naming.getTitle("pet")}</span>
              <div className={styles.lookupRow}>
                <input value={selectedPetLabel} placeholder={naming.getMessage("appointmentsSelectPet")} readOnly />
                <button
                  type="button"
                  className={styles.lookupBtn}
                  title={naming.getMessage("appointmentsSelectPet")}
                  aria-label={naming.getMessage("appointmentsSelectPet")}
                  onClick={() => setPetLookupOpen(true)}
                  disabled={isEdit}
                >
                  <MagnifyingGlassIcon size={16} />
                </button>
              </div>
            </label>

            {form.appointmentType === "VET" && (
              <label className={styles.field}>
                <span>{naming.getRole("VET")}</span>
                <select
                  value={form.veterinarianUserId}
                  onChange={(e) => setForm((s) => ({ ...s, veterinarianUserId: e.target.value }))}
                >
                  <option value="">{naming.getMessage("appointmentsSelectVetOptional")}</option>
                  {vets.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {form.appointmentType === "PETSHOP" && (
              <label className={styles.field}>
                <span>{naming.getMessage("appointmentsService")}</span>
                <div className={styles.lookupRow}>
                  <input value={selectedServiceLabel} placeholder={naming.getMessage("appointmentsSelectService")} readOnly />
                  <button
                    type="button"
                    className={styles.lookupBtn}
                    title={naming.getMessage("appointmentsSelectService")}
                    aria-label={naming.getMessage("appointmentsSelectService")}
                    onClick={() => setServiceLookupOpen(true)}
                  >
                    <MagnifyingGlassIcon size={16} />
                  </button>
                </div>
              </label>
            )}

            <label className={styles.field}>
              <span>{naming.getMessage("appointmentsStartAt")}</span>
              <input
                type="datetime-local"
                value={form.scheduledStartAt}
                onChange={(e) => setForm((s) => ({ ...s, scheduledStartAt: e.target.value }))}
                required
              />
            </label>

            <label className={styles.field}>
              <span>{naming.getMessage("appointmentsDurationMinutes")}</span>
              <input
                type="number"
                min={1}
                value={form.durationMinutes}
                onChange={(e) => setForm((s) => ({ ...s, durationMinutes: e.target.value }))}
                required
              />
            </label>

            <label className={`${styles.field} ${styles.full}`}>
              <span>{naming.getLabel("notes")}</span>
              <textarea value={form.notes} rows={3} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
            </label>

            {form.appointmentType === "VET" && (
              <label className={`${styles.field} ${styles.full}`}>
                <span>{naming.getMessage("appointmentsChiefComplaint")}</span>
                <textarea
                  value={form.chiefComplaint}
                  rows={3}
                  onChange={(e) => setForm((s) => ({ ...s, chiefComplaint: e.target.value }))}
                />
              </label>
            )}
            </div>

            <div className={styles.actions}>
              <button className={styles.btnGhost} type="button" onClick={onClose} disabled={saving}>
                {naming.getLabel("cancel")}
              </button>
              <button className={styles.btnPrimary} type="submit" disabled={!canSubmit || saving}>
                {saving ? naming.getLabel("saving") : naming.getLabel("save")}
              </button>
            </div>
          </form>
        </div>
      </div>

      {petLookupOpen && !isEdit && (
        <PetLookupModal
          onClose={() => setPetLookupOpen(false)}
          onSelect={(pet) => {
            setSelectedPet(pet);
            setForm((s) => ({ ...s, petId: String(pet.id) }));
            setPetLookupOpen(false);
          }}
        />
      )}

      {serviceLookupOpen && form.appointmentType === "PETSHOP" && (
        <ServiceLookupModal
          services={services}
          onClose={() => setServiceLookupOpen(false)}
          onSelect={(service) => {
            setSelectedServiceName(service.name);
            setForm((s) => ({ ...s, serviceProductId: String(service.id) }));
            setServiceLookupOpen(false);
          }}
        />
      )}
    </>
  );
}
