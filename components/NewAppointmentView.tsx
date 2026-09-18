"use client";

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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { findPatientByIdentificationNumber } from "@/lib/actions/patient.actions";

interface FoundPatient {
  $id: string;
  // Optional since TASK-023/024: staff-created patients have no linked User.
  userId?: string;
  name: string;
}

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
export const NewAppointmentView = ({
  doctors,
  treatments,
  insuranceProviders,
}: {
  doctors: DoctorOption[];
  treatments: TreatmentOption[];
  insuranceProviders: { name: string }[];
}) => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [patient, setPatient] = useState<FoundPatient | null>(null);

  const [doctorName, setDoctorName] = useState("");
  const [treatmentId, setTreatmentId] = useState("");

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
      setOpenSections((prev) => prev.filter((section) => section !== "patient"));
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

  const handleSearch = async () => {
    setIsSearching(true);
    setSearchError(null);

    const found = await findPatientByIdentificationNumber(query);

    setIsSearching(false);

    if (found) {
      setPatient(found);
    } else {
      setPatient(null);
      setSearchError("No se encontró ningún paciente con ese DNI.");
    }
  };

  const changePatient = () => {
    setPatient(null);
    setQuery("");
    setSearchError(null);
  };

  const selectedDoctor = doctors.find((doctor) => doctor.name === doctorName);
  const selectedTreatment = treatments.find(
    (treatment) => treatment.id === treatmentId,
  );

  const ready = Boolean(patient && selectedDoctor && selectedTreatment);

  return (
    <section className="w-full max-w-4xl space-y-6">
      <div className="space-y-2">
        <h1 className="header">Nuevo turno</h1>
        <p className="text-dark-700">
          Buscá al paciente, elegí doctor y prestación, y seleccioná el
          horario en el calendario.
        </p>
      </div>

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
                <div className="flex gap-2">
                  <Input
                    className="shad-input"
                    placeholder="DNI del paciente"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <Button
                    type="button"
                    className="shad-primary-btn"
                    disabled={isSearching || !query.trim()}
                    onClick={handleSearch}
                  >
                    Buscar
                  </Button>
                </div>
                {searchError && (
                  <div className="space-y-3">
                    <p className="shad-error text-14-regular">{searchError}</p>
                    <CreatePatientModal
                      doctors={doctors}
                      insuranceProviders={insuranceProviders}
                      defaultIdentificationNumber={query.trim() || undefined}
                      onCreated={(created) => {
                        setSearchError(null);
                        setPatient(created);
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            {patient && (
              <div className="flex items-center justify-between">
                <p className="text-14-medium">
                  Paciente:{" "}
                  <span className="text-green-500">{patient.name}</span>
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="shad-gray-btn"
                  onClick={changePatient}
                >
                  Cambiar paciente
                </Button>
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
                <p className="shad-input-label">Doctor</p>
                <Select value={doctorName} onValueChange={setDoctorName}>
                  <SelectTrigger className="shad-select-trigger" aria-label="Doctor">
                    <SelectValue placeholder="Seleccioná un doctor" />
                  </SelectTrigger>
                  <SelectContent className="shad-select-content">
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
                <p className="shad-input-label">Prestación</p>
                <Select value={treatmentId} onValueChange={setTreatmentId}>
                  <SelectTrigger className="shad-select-trigger" aria-label="Prestación">
                    <SelectValue placeholder="Seleccioná la prestación estimada" />
                  </SelectTrigger>
                  <SelectContent className="shad-select-content">
                    {treatments.map((treatment) => (
                      <SelectItem key={treatment.id} value={treatment.id}>
                        {treatment.name} ({treatment.estimatedDurationMinutes}{" "}
                        min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {ready && selectedDoctor && selectedTreatment && patient ? (
        <DoctorWeekCalendar
          key={selectedDoctor.name}
          doctorName={selectedDoctor.name}
          availability={selectedDoctor.availability ?? []}
          patientId={patient.$id}
          userId={patient.userId}
          treatmentId={selectedTreatment.id}
          treatmentName={selectedTreatment.name}
        />
      ) : (
        <p className="text-dark-700">
          Completá los datos del paciente y del doctor para ver el calendario
          de turnos disponibles.
        </p>
      )}
    </section>
  );
};
