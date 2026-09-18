"use client";

import { useState } from "react";

import { CreatePatientModal } from "@/components/CreatePatientModal";
import { PatientRow } from "@/components/PatientRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listPatients } from "@/lib/actions/patient.actions";

interface PatientListItem {
  $id: string;
  name: string;
  email: string;
  phone: string;
  identificationType?: string;
  identificationNumber?: string;
}

// Shared presentational component behind /admin/pacientes and
// /recepcion/pacientes (TASK-035) — list + filters, plus (TASK-039) a
// contextual "search-then-create" affordance: same list-only pattern TASK-034
// established, but with the create Dialog scoped to the specific case of "you
// searched for someone and they're not here" instead of a general-purpose
// create button (that already exists as the standalone "Nuevo paciente" page,
// left untouched).
//
// Filtering is server-side, re-querying `listPatients` on submit rather than
// filtering a client-side copy of the full table — same shape as
// AdminNewAppointmentModal's DNI search (TASK-033), the closest existing
// precedent for a patient search UX, and it avoids ever shipping the entire
// patient table to the browser as the clinic's patient list grows.
export const PatientsList = ({
  initialPatients,
  doctors,
  insuranceProviders,
}: {
  initialPatients: PatientListItem[];
  doctors: { name: string; image?: string }[];
  insuranceProviders: { name: string }[];
}) => {
  const [patients, setPatients] = useState(initialPatients);
  const [name, setName] = useState("");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  // Tracks the filters actually used for the last completed search, so the
  // empty-results "Crear paciente" affordance only appears after a genuine
  // search (not on the initial unfiltered load) — see handleSearch/handleClear.
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  const runSearch = async (filters: {
    name?: string;
    identificationNumber?: string;
  }) => {
    setIsSearching(true);
    const result = await listPatients(filters);
    setPatients(result);
    setHasActiveFilters(Boolean(filters.name?.trim() || filters.identificationNumber?.trim()));
    setIsSearching(false);
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    runSearch({ name, identificationNumber });
  };

  const handleClear = () => {
    setName("");
    setIdentificationNumber("");
    runSearch({});
  };

  const showCreateOnEmptyResults = hasActiveFilters && patients.length === 0;

  return (
    <section className="w-full space-y-4">
      <h1 className="header">Pacientes</h1>

      <form onSubmit={handleSearch} className="mb-4 flex flex-col gap-2">
        <p>Buscar paciente</p>
        <div className="flex justify-between">
          <div className="flex w-1/2 gap-2">
            <Input
              className="shad-input w-1/2"
              placeholder="Nombre"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Input
              className="shad-input w-1/2"
              placeholder="DNI"
              value={identificationNumber}
              onChange={(event) => setIdentificationNumber(event.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              className="shad-primary-btn"
              disabled={isSearching}
            >
              Buscar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="shad-gray-btn"
              onClick={handleClear}
              disabled={isSearching}
            >
              Limpiar
            </Button>
          </div>
        </div>
      </form>

      <ul className="space-y-4">
        {patients.map((patient) => (
          <PatientRow key={patient.$id} patient={patient} />
        ))}
        {patients.length === 0 && !showCreateOnEmptyResults && (
          <p className="text-dark-700">No se encontraron pacientes.</p>
        )}
      </ul>

      {showCreateOnEmptyResults && (
        <div className="flex flex-col items-start gap-3 rounded-md border border-dark-500 p-4">
          <p className="text-dark-700">
            No se encontraron pacientes que coincidan con la búsqueda.
          </p>
          <CreatePatientModal
            doctors={doctors}
            insuranceProviders={insuranceProviders}
            defaultName={name.trim() || undefined}
            defaultIdentificationNumber={identificationNumber.trim() || undefined}
          />
        </div>
      )}
    </section>
  );
};
