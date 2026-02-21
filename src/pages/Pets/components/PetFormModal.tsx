import { useEffect, useMemo, useState } from "react";
import styles from "./PetFormModal.module.css";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useConfirmStore } from "../../../store/confirm.store";
import {
  createPet,
  getPetById,
  updatePet,
} from "../../../services/api/pets.service";
import { listTutors } from "../../../services/api/tutors.service";
import {
  PET_SEX_OPTIONS,
  PET_SPECIES_OPTIONS,
} from "../../../services/api/types";
import type {
  CreatePetRequest,
  PetResponse,
  PetSex,
  PetSpecies,
  TutorListItemResponse,
  UpdatePetRequest,
} from "../../../services/api/types";
import { useNaming } from "../../../i18n/useNaming";
import { getApiErrorMessage } from "../../../services/api/errors";
import { TutorLookupModal } from "../../../components/lookups/TutorLookupModal";
import { DateInputBR } from "../../../components/DateInputBR/DateInputBR";

type Props = {
  petId?: number;
  onClose: () => void;
  onSaved: () => void;
};

type FormState = {
  tutorId: string;
  name: string;
  species: PetSpecies;
  breed: string;
  sex: "" | PetSex;
  birthDate: string;
  weightKg: string;
  notes: string;
};

function trimOrUndefined(value: string) {
  const v = value.trim();
  return v ? v : undefined;
}

function toWeightOrUndefined(value: string) {
  const v = value.trim().replace(",", ".");
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function toDateOrUndefined(value: string) {
  const v = value.trim();
  return v || undefined;
}

function toFormState(p: PetResponse): FormState {
  return {
    tutorId: String(p.tutorId),
    name: p.name ?? "",
    species: p.species,
    breed: p.breed ?? "",
    sex: p.sex ?? "",
    birthDate: p.birthDate ?? "",
    weightKg: p.weightKg != null ? String(p.weightKg) : "",
    notes: p.notes ?? "",
  };
}

export function PetFormModal({ petId, onClose, onSaved }: Props) {
  const naming = useNaming();
  const isEdit = typeof petId === "number";
  const confirm = useConfirmStore((s) => s.confirm);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tutors, setTutors] = useState<TutorListItemResponse[]>([]);
  const [tutorLookupOpen, setTutorLookupOpen] = useState(false);
  const [selectedTutorName, setSelectedTutorName] = useState("");

  const [form, setForm] = useState<FormState>({
    tutorId: "",
    name: "",
    species: "DOG",
    breed: "",
    sex: "",
    birthDate: "",
    weightKg: "",
    notes: "",
  });

  const canSubmit = useMemo(() => {
    if (!form.tutorId) return false;
    if (!form.name.trim()) return false;
    if (!form.species) return false;
    return true;
  }, [form]);

  const selectedTutorLabel = useMemo(() => {
    if (selectedTutorName) return selectedTutorName;
    const selected = tutors.find((t) => String(t.id) === form.tutorId);
    return selected?.name ?? "";
  }, [selectedTutorName, tutors, form.tutorId]);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      setLoading(true);
      try {
        const tutorsResp = await listTutors({ page: 0, size: 300, sort: "name,asc", active: true });
        if (!mounted) return;
        setTutors(tutorsResp.content ?? []);

        if (isEdit) {
          const p = await getPetById(petId!);
          if (!mounted) return;
          setForm(toFormState(p));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, [isEdit, petId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tutorId = Number(form.tutorId);
    if (!Number.isFinite(tutorId)) return;

    const ok = await confirm({
      title: isEdit ? naming.getMessage("saveChanges") : naming.getMessage("createPet"),
      message: isEdit ? naming.getMessage("saveChangesPetConfirm") : naming.getMessage("createPetConfirm"),
      confirmText: naming.getLabel("confirm"),
      cancelText: naming.getLabel("cancel"),
      danger: false,
    });
    if (!ok) return;

    setSaving(true);
    try {
      const base = {
        tutorId,
        name: form.name.trim(),
        species: form.species,
        breed: trimOrUndefined(form.breed),
        sex: (form.sex || undefined) as PetSex | undefined,
        birthDate: toDateOrUndefined(form.birthDate),
        weightKg: toWeightOrUndefined(form.weightKg),
        notes: trimOrUndefined(form.notes),
      };

      if (isEdit) {
        await updatePet(petId!, base as UpdatePetRequest);
      } else {
        await createPet(base as CreatePetRequest);
      }

      onSaved();
    } catch (error) {
      const apiMsg = getApiErrorMessage(error);
      await confirm({
        title: naming.getTitle("pet"),
        message: apiMsg ?? (error instanceof Error ? error.message : naming.getMessage("unknown")),
        confirmText: naming.getLabel("ok"),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.title}>{isEdit ? naming.getTitle("editPet") : naming.getTitle("newPet")}</div>
        </div>

        {loading ? (
          <div className={styles.state}>{naming.getLabel("loading")}</div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span>{naming.getLabel("tutor")}</span>
                <div className={styles.lookupRow}>
                  <input value={selectedTutorLabel} placeholder={naming.getLabel("selectTutor")} readOnly />
                  <button
                    type="button"
                    className={styles.lookupBtn}
                    title={naming.getLabel("selectTutor")}
                    aria-label={naming.getLabel("selectTutor")}
                    onClick={() => setTutorLookupOpen(true)}
                  >
                    <MagnifyingGlassIcon size={16} />
                  </button>
                </div>
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("name")}</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  placeholder={naming.getPlaceholder("petName")}
                  required
                />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("species")}</span>
                <select
                  value={form.species}
                  onChange={(e) => setForm((s) => ({ ...s, species: e.target.value as PetSpecies }))}
                  required
                >
                  {PET_SPECIES_OPTIONS.map((species) => (
                    <option key={species} value={species}>{naming.t(`species.${species}`)}</option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("breed")}</span>
                <input
                  value={form.breed}
                  onChange={(e) => setForm((s) => ({ ...s, breed: e.target.value }))}
                  placeholder={naming.getLabel("optional")}
                />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("sex")}</span>
                <select
                  value={form.sex}
                  onChange={(e) => setForm((s) => ({ ...s, sex: e.target.value as "" | PetSex }))}
                >
                  <option value="">{naming.getLabel("optional")}</option>
                  {PET_SEX_OPTIONS.map((sex) => (
                    <option key={sex} value={sex}>{naming.t(`petSex.${sex}`)}</option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("birthDate")}</span>
                <DateInputBR
                  value={form.birthDate}
                  onChange={(value) => setForm((s) => ({ ...s, birthDate: value }))}
                  ariaLabel={naming.getLabel("birthDate")}
                />
              </label>

              <label className={styles.field}>
                <span>{naming.getLabel("weightKg")}</span>
                <input
                  inputMode="decimal"
                  value={form.weightKg}
                  onChange={(e) => setForm((s) => ({ ...s, weightKg: e.target.value }))}
                  placeholder="0.00"
                />
              </label>

              <label className={`${styles.field} ${styles.full}`}>
                <span>{naming.getLabel("notes")}</span>
                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
                />
              </label>
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.btnGhost} onClick={onClose} disabled={saving}>
                {naming.getLabel("cancel")}
              </button>
              <button type="submit" className={styles.btnPrimary} disabled={!canSubmit || saving}>
                {saving ? naming.getLabel("saving") : naming.getLabel("save")}
              </button>
            </div>
          </form>
        )}
      </div>

      {tutorLookupOpen && (
        <TutorLookupModal
          onClose={() => setTutorLookupOpen(false)}
          onSelect={(tutor) => {
            setSelectedTutorName(tutor.name);
            setForm((s) => ({ ...s, tutorId: String(tutor.id) }));
            setTutorLookupOpen(false);
          }}
        />
      )}
    </div>
  );
}
