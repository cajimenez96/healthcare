"use client";

import { useState } from "react";

import { AppointmentForm } from "@/components/forms/AppointmentForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { findPatientByContact } from "@/lib/actions/patient.actions";

import "react-datepicker/dist/react-datepicker.css";

interface FoundPatient {
  $id: string;
  // Optional since TASK-023/024: staff-created patients have no linked User.
  userId?: string;
  name: string;
}

export const AdminNewAppointmentModal = ({
  doctors,
}: {
  doctors: {
    name: string;
    image: string;
    availability?: { dayOfWeek: number; startTime: string; endTime: string }[];
  }[];
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [patient, setPatient] = useState<FoundPatient | null>(null);

  const reset = () => {
    setQuery("");
    setSearchError(null);
    setPatient(null);
  };

  const handleSearch = async () => {
    setIsSearching(true);
    setSearchError(null);

    const found = await findPatientByContact(query);

    setIsSearching(false);

    if (found) {
      setPatient(found);
    } else {
      setSearchError("No se encontró ningún paciente con ese email o teléfono.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="shad-primary-btn">
          Nuevo turno
        </Button>
      </DialogTrigger>
      <DialogContent
        className="shad-dialog sm:max-w-md"
        // AppointmentForm's date picker presses Escape to dismiss its own
        // popup (see e2e/helpers.ts's pickAppointmentDateTime) — without
        // this, that keypress bubbles up and closes this Dialog too,
        // silently discarding the in-progress form. The visible "X" button
        // and overlay click still close it normally.
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="mb-4 space-y-3">
          <DialogTitle>Nuevo turno</DialogTitle>
          <DialogDescription>
            Buscá al paciente por su email o teléfono para agendarle un turno.
          </DialogDescription>
        </DialogHeader>

        {!patient && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                className="shad-input"
                placeholder="Email o teléfono del paciente"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
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
            {searchError && <p className="shad-error text-14-regular">{searchError}</p>}
          </div>
        )}

        {patient && (
          <div className="space-y-4">
            <p className="text-14-medium">
              Paciente: <span className="text-green-500">{patient.name}</span>
            </p>
            <AppointmentForm
              userId={patient.userId}
              patientId={patient.$id}
              type="create"
              doctors={doctors}
              setOpen={setOpen}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
