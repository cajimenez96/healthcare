"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CreatePatientModal } from "@/components/CreatePatientModal";
import { DoctorAvatar } from "@/components/DoctorAvatar";
import { DoctorWeekCalendar } from "@/components/DoctorWeekCalendar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listPatients } from "@/lib/actions/patient.actions";

interface FoundPatient {
  $id: string;
  // Optional since TASK-023/024: staff-created patients have no linked User.
  userId?: string;
  name: string;
  phone: string;
  identificationType?: string;
  identificationNumber?: string;
}

// TASK-050: real-time debounce (not Enter-triggered) — this box now searches
// name OR DNI together (vs. TASK-033's exact-DNI-only lookup), and typing a
// partial name/DNI while the patient is standing at the desk is the common
// case, so results should appear as the front-desk worker types rather than
// after an extra keypress/click. No debounce utility existed elsewhere in
// the codebase (PatientsList/TASK-035 searches on explicit form submit
// instead) — this is a small self-contained one via useEffect + setTimeout.
const SEARCH_DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

interface DoctorOption {
  name: string;
  image?: string;
  availability?: { dayOfWeek: number; startTime: string; endTime: string }[];
}

interface TreatmentOption {
  id: string;
  name: string;
  estimatedDurationMinutes: number;
}

// TASK-043: replaces AdminNewAppointmentModal entirely — a full page instead
// of a small dialog, with "Datos del paciente"/"Datos del doctor" as
// collapsible accordions (each open by default, auto-collapsing to a
// one-line summary the first time it becomes complete, still reopenable to
// change the selection) and a week calendar that only mounts once patient +
// doctor + treatment are all chosen.
//
// TASK-051: once patient + doctor + treatment are all selected, the
// accordion above is replaced entirely (not just auto-collapsed) by a
// compact, non-collapsible summary bar + "Ver calendario" trigger — the
// calendar itself now opens in a large Dialog (~80vw x 90vh) instead of
// mounting inline in the page flow, so it stops competing for space with
// the accordion. "Cambiar paciente"/"Cambiar doctor" on that summary bar
// clear the relevant selection, which drops `patient`/`selectedDoctor` back
// to falsy and brings the accordion back — no separate "back to accordion"
// state needed.
//
// TASK-056: also the reschedule view for an existing appointment, driven by
// an optional `appointmentId` (same ?appointmentId= query-param pattern as
// /doctor/patient/[id], TASK-008) — the page passes it down along with that
// appointment's current patient/doctor/treatment as `initial*` props to
// pre-fill this same accordion/summary/calendar flow. Doctor and treatment
// stay fully editable in reschedule mode (the point of the ticket: not just
// the date), same as the old AppointmentForm "schedule" case's doctor
// picker. The patient does NOT — that case never let you change the patient
// either, and reassigning an existing appointment to a different patient
// isn't a real "reschedule" — so the patient accordion/summary never offer
// "Cambiar paciente" here, only a fixed read-only display.
export const NewAppointmentView = ({
  doctors,
  treatments,
  insuranceProviders,
  appointmentId,
  initialPatient,
  initialDoctorName,
  initialTreatmentId,
  initialStatus,
  basePath,
}: {
  doctors: DoctorOption[];
  treatments: TreatmentOption[];
  insuranceProviders: { name: string }[];
  appointmentId?: string;
  initialPatient?: FoundPatient;
  initialDoctorName?: string;
  initialTreatmentId?: string;
  // TASK-067: the appointment's current status, threaded down to
  // DoctorWeekCalendar so rescheduling preserves it instead of forcing
  // "scheduled".
  initialStatus?: Status;
  // TASK-063: this view is now hosted at both /admin/turnos and
  // /recepcion/turnos (previously admin-only, TASK-060) — basePath is the
  // unified list route to redirect back to after booking, so the component
  // stays agnostic of which role's route rendered it instead of hardcoding
  // /admin/turnos for both.
  basePath: string;
}) => {
  const isReschedule = Boolean(appointmentId);
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoundPatient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [patient, setPatient] = useState<FoundPatient | null>(
    initialPatient ?? null
  );

  const [doctorName, setDoctorName] = useState(initialDoctorName ?? "");
  const [treatmentId, setTreatmentId] = useState(initialTreatmentId ?? "");

  // TASK-051: the calendar Dialog's own open state — separate from the
  // patient/doctor/treatment selection so closing it (to check the summary
  // bar, or via "Cambiar paciente"/"Cambiar doctor") never discards the
  // current selection, only hides the calendar.
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [openSections, setOpenSections] = useState<string[]>([
    "patient",
    "doctor",
  ]);
  // Each ref latches once its section first becomes complete, so the
  // auto-collapse only fires on that transition — reopening afterward (to
  // change the patient/doctor) is then fully under the user's own control
  // and won't get force-collapsed again on every render.
  const patientCollapsedRef = useRef(false);
  const doctorCollapsedRef = useRef(false);

  const doctorReady = Boolean(doctorName && treatmentId);

  useEffect(() => {
    if (patient && !patientCollapsedRef.current) {
      patientCollapsedRef.current = true;
      setOpenSections((prev) =>
        prev.filter((section) => section !== "patient")
      );
    }
    if (!patient) {
      patientCollapsedRef.current = false;
    }
  }, [patient]);

  useEffect(() => {
    if (doctorReady && !doctorCollapsedRef.current) {
      doctorCollapsedRef.current = true;
      setOpenSections((prev) => prev.filter((section) => section !== "doctor"));
    }
    if (!doctorReady) {
      doctorCollapsedRef.current = false;
    }
  }, [doctorReady]);

  // Debounces `query` and re-searches by name OR DNI (TASK-050) via
  // listPatients/findAll's `search` filter. Skipped entirely once a patient
  // is already selected, and below MIN_QUERY_LENGTH to avoid firing a query
  // on every single keystroke for a near-empty box.
  useEffect(() => {
    const trimmed = query.trim();

    if (patient || trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const timeoutId = setTimeout(async () => {
      const found = await listPatients({ search: trimmed });
      setResults(found);
      setHasSearched(true);
      setIsSearching(false);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [query, patient]);

  const isNumericQuery = /^\d+$/.test(query.trim());

  const selectPatient = (found: FoundPatient) => {
    setPatient(found);
    setQuery("");
    setResults([]);
    setHasSearched(false);
  };

  const changePatient = () => {
    setPatient(null);
    setQuery("");
    setResults([]);
    setHasSearched(false);
    setCalendarOpen(false);
  };

  // TASK-051: mirrors changePatient above — clearing both fields drops
  // doctorReady (and therefore the summary bar's `ready` check) back to
  // false, which brings the accordion's "Datos del doctor" section back so
  // the user can pick again. Also closes the calendar Dialog in case it was
  // open, since its selected doctor is going away.
  const changeDoctor = () => {
    setDoctorName("");
    setTreatmentId("");
    setCalendarOpen(false);
  };

  const selectedDoctor = doctors.find((doctor) => doctor.name === doctorName);
  const selectedTreatment = treatments.find(
    (treatment) => treatment.id === treatmentId
  );

  // TASK-053: this view is the only one that knows which route hosts it, so
  // the post-booking redirect lives here rather than inside
  // DoctorWeekCalendar (which stays reusable/host-agnostic). A short delay
  // lets DoctorWeekCalendar's own "Turno agendado/reagendado con éxito."
  // message register before the list takes over — the table there will
  // already show the (re)scheduled appointment.
  // TASK-063: redirects to `basePath` instead of a hardcoded /admin/turnos,
  // so booking/rescheduling from /recepcion/turnos returns Secretaria to her
  // own route rather than to an admin-only one middleware.ts would block.
  const handleBooked = () => {
    setTimeout(() => {
      router.push(basePath);
    }, 1200);
  };

  return (
    <section className="w-full max-w-4xl space-y-6">
      <div className="space-y-2">
        <h1 className="header">
          {isReschedule ? "Reagendar turno" : "Nuevo turno"}
        </h1>
        <p className="text-dark-700">
          {isReschedule
            ? "Elegí doctor, prestación y el nuevo horario en el calendario."
            : "Buscá al paciente, elegí doctor y prestación, y seleccioná el horario en el calendario."}
        </p>
      </div>

      {patient && selectedDoctor && selectedTreatment ? (
        // TASK-051: once all three are selected, the accordion is gone
        // entirely (not just auto-collapsed) — replaced by this compact,
        // non-collapsible summary bar so it stops competing with the
        // calendar Dialog for space. "Cambiar paciente"/"Cambiar doctor"
        // are the way back: they clear the relevant selection, which falls
        // this condition back to false and brings the accordion back.
        <div className="space-y-3 rounded-md border border-dark-500 bg-dark-400 p-4">
          <div className="flex w-full justify-between">
            <div className="flex h-full flex-col gap-2">
              <p className="text-14-medium">
                · Paciente:{" "}
                <span className="text-green-500">{patient.name}</span>
              </p>
              <p className="text-14-medium">
                · Doctor:{" "}
                <span className="text-green-500">{selectedDoctor.name}</span>
              </p>
              <p className="text-14-medium">
                · Prestación:{" "}
                <span className="text-green-500">{selectedTreatment.name}</span>
              </p>
            </div>
            <div className="flex h-full flex-wrap items-start gap-2">
              {!isReschedule && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={changePatient}
                >
                  Cambiar paciente
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={changeDoctor}
              >
                Cambiar doctor
              </Button>
            </div>
          </div>

          <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
            <DialogTrigger asChild>
              <Button type="button">
                Ver calendario
              </Button>
            </DialogTrigger>
            {/* TASK-051: ~80vw x 90vh, much more room than the old inline
                layout. flex/flex-col + min-h-0 on the scroll area keeps the
                fixed header from being squeezed by react-big-calendar's own
                fixed 600px height. */}
            <DialogContent className="flex h-[90vh] w-[80vw] max-w-none flex-col overflow-hidden">
              <DialogHeader className="shrink-0">
                <DialogTitle>Calendario de turnos</DialogTitle>
                <p className="text-14-regular text-dark-700">
                  Paciente:{" "}
                  <span className="text-green-500">{patient.name}</span>
                  {" · "}
                  Doctor:{" "}
                  <span className="text-green-500">{selectedDoctor.name}</span>
                  {" · "}
                  Prestación:{" "}
                  <span className="text-green-500">
                    {selectedTreatment.name}
                  </span>
                </p>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <DoctorWeekCalendar
                  key={selectedDoctor.name}
                  doctorName={selectedDoctor.name}
                  availability={selectedDoctor.availability ?? []}
                  patientId={patient.$id}
                  userId={patient.userId}
                  treatmentId={selectedTreatment.id}
                  treatmentName={selectedTreatment.name}
                  appointmentId={appointmentId}
                  currentStatus={initialStatus}
                  onBooked={handleBooked}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <>
          <Accordion
            type="multiple"
            value={openSections}
            onValueChange={setOpenSections}
            className="rounded-md border border-dark-500 bg-dark-400 px-4"
          >
            <AccordionItem value="patient">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  Datos del paciente
                  {patient && (
                    <span className="text-14-regular text-green-500">
                      {patient.name}
                    </span>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                {!patient && (
                  <div className="space-y-4">
                    <Input
                      placeholder="Buscar por nombre o DNI"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      aria-label="Buscar paciente por nombre o DNI"
                    />
                    {isSearching && (
                      <p className="text-12-regular text-dark-700">Buscando…</p>
                    )}
                    {!isSearching && hasSearched && results.length > 0 && (
                      <ul className="space-y-2">
                        {results.map((found) => (
                          <li key={found.$id}>
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-auto w-full justify-start rounded-md border border-dark-500 p-4 text-left"
                              onClick={() => selectPatient(found)}
                            >
                              <div className="space-y-1">
                                <p className="text-14-medium">{found.name}</p>
                                <p className="text-12-regular text-dark-700">
                                  {found.identificationNumber
                                    ? `${found.identificationType ?? "Documento"}: ${found.identificationNumber}`
                                    : "Sin documento registrado"}{" "}
                                  · {found.phone}
                                </p>
                              </div>
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {!isSearching && hasSearched && results.length === 0 && (
                      <div className="space-y-3">
                        <p className="shad-error text-14-regular">
                          No se encontraron pacientes que coincidan con la
                          búsqueda.
                        </p>
                        <CreatePatientModal
                          doctors={doctors}
                          insuranceProviders={insuranceProviders}
                          defaultName={
                            !isNumericQuery ? query.trim() : undefined
                          }
                          defaultIdentificationNumber={
                            isNumericQuery ? query.trim() : undefined
                          }
                          onCreated={(created) => {
                            setHasSearched(false);
                            setResults([]);
                            setPatient(created);
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
                {patient && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-14-medium">
                        Paciente:{" "}
                        <span className="text-green-500">{patient.name}</span>
                      </p>
                      <p className="text-12-regular text-dark-700">
                        {patient.identificationNumber
                          ? `${patient.identificationType ?? "Documento"}: ${patient.identificationNumber}`
                          : "Sin documento registrado"}{" "}
                        · {patient.phone}
                      </p>
                    </div>
                    {!isReschedule && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={changePatient}
                      >
                        Cambiar paciente
                      </Button>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="doctor">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  Datos del doctor
                  {doctorReady && (
                    <span className="text-14-regular text-green-500">
                      {doctorName} · {selectedTreatment?.name}
                    </span>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-14-medium text-dark-700">Doctor</p>
                    <Select value={doctorName} onValueChange={setDoctorName}>
                      <SelectTrigger aria-label="Doctor">
                        <SelectValue placeholder="Seleccioná un doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.name} value={doctor.name}>
                            <div className="flex cursor-pointer items-center gap-2">
                              <DoctorAvatar
                                name={doctor.name}
                                image={doctor.image}
                                size={32}
                              />
                              <p>{doctor.name}</p>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <p className="text-14-medium text-dark-700">Prestación</p>
                    <Select value={treatmentId} onValueChange={setTreatmentId}>
                      <SelectTrigger aria-label="Prestación">
                        <SelectValue placeholder="Seleccioná la prestación estimada" />
                      </SelectTrigger>
                      <SelectContent>
                        {treatments.map((treatment) => (
                          <SelectItem key={treatment.id} value={treatment.id}>
                            {treatment.name} (
                            {treatment.estimatedDurationMinutes} min)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <p className="text-dark-700">
            Completá los datos del paciente y del doctor para ver el calendario
            de turnos disponibles.
          </p>
        </>
      )}
    </section>
  );
};
