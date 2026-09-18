"use client";

import { useState } from "react";

import { CreatePatientForm } from "@/components/forms/CreatePatientForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// TASK-039: Dialog wrapper around CreatePatientForm (TASK-024), same shape as
// CreateDoctorModal/CreateSecretariaModal (TASK-034). Used from PatientsList
// as the contextual "search-then-create" entry point (mirrors
// AdminNewAppointmentModal's search-then-offer-create UX, TASK-018/024) — the
// standalone /admin/pacientes/nuevo and /recepcion/pacientes/nuevo pages
// (TASK-024) remain untouched as the primary, always-available entry point.
//
// `defaultName`/`defaultIdentificationNumber` pre-fill the form from
// whatever the caller already typed into PatientsList's search filters, so
// the user doesn't have to retype what they just searched for.
export const CreatePatientModal = ({
  doctors,
  insuranceProviders,
  defaultName,
  defaultIdentificationNumber,
  onCreated,
}: {
  doctors: { name: string; image?: string }[];
  insuranceProviders: { name: string }[];
  defaultName?: string;
  defaultIdentificationNumber?: string;
  // TASK-043: forwarded straight through to CreatePatientForm — see its own
  // comment for why this is optional/additive.
  onCreated?: (patient: { $id: string; name: string }) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="shad-primary-btn">
          Crear paciente
        </Button>
      </DialogTrigger>
      <DialogContent className="shad-dialog max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle>Nuevo paciente</DialogTitle>
        </DialogHeader>
        <CreatePatientForm
          doctors={doctors}
          insuranceProviders={insuranceProviders}
          setOpen={setOpen}
          defaultName={defaultName}
          defaultIdentificationNumber={defaultIdentificationNumber}
          onCreated={onCreated}
        />
      </DialogContent>
    </Dialog>
  );
};
