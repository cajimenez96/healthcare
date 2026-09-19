"use client";

import { useState } from "react";

import EditPatientForm from "@/components/forms/EditPatientForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { setPatientActive } from "@/lib/actions/patient.actions";

interface PatientRowProps {
  patient: {
    $id: string;
    name: string;
    email: string;
    phone: string;
    birthDate: string;
    gender: Gender;
    address: string;
    occupation: string;
    emergencyContactName?: string;
    emergencyContactNumber?: string;
    primaryPhysician: string;
    insuranceProvider?: string;
    insurancePolicyNumber?: string;
    identificationType?: string;
    identificationNumber?: string;
    isActive?: boolean;
  };
  doctors: { name: string; image?: string }[];
  insuranceProviders: { name: string }[];
  // TASK-059: called after a successful edit or activation toggle so the
  // parent PatientsList (which holds its own `patients` state for the
  // search feature, TASK-035) can refresh the current view — see
  // PatientsList's `refresh`.
  onChanged: () => void;
}

// TASK-059: gained Editar/Desactivar-Reactivar, same Dialog pattern already
// used by SecretariaRow/DoctorRow (TASK-026/034) — this row was
// intentionally list-only until now (TASK-035).
export const PatientRow = ({
  patient,
  doctors,
  insuranceProviders,
  onChanged,
}: PatientRowProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  // Same `undefined`-is-active discipline as TASK-025/035 established for
  // User/Doctor — patients persisted before this field existed read back as
  // `undefined`, not `true`.
  const isActive = patient.isActive !== false;

  const identification = patient.identificationNumber
    ? `${patient.identificationType ?? "Documento"}: ${patient.identificationNumber}`
    : "Sin documento registrado";

  const toggleActive = async () => {
    setIsToggling(true);
    await setPatientActive(patient.$id, !isActive);
    setIsToggling(false);
    onChanged();
  };

  return (
    <li className="flex items-center gap-4 rounded-md border border-dark-500 p-4">
      <div className="flex-1 space-y-1">
        <p className="text-14-medium">
          {patient.name}
          {!isActive && <span className="text-dark-700"> (inactivo)</span>}
        </p>
        <p className="text-12-regular text-dark-700">
          {identification} · {patient.phone} · {patient.email}
        </p>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="shad-gray-btn">
            Editar
          </Button>
        </DialogTrigger>
        <DialogContent className="shad-dialog max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle>Editar paciente</DialogTitle>
          </DialogHeader>
          <EditPatientForm
            patient={patient}
            doctors={doctors}
            insuranceProviders={insuranceProviders}
            onDone={() => {
              setIsEditOpen(false);
              onChanged();
            }}
          />
        </DialogContent>
      </Dialog>

      <Button
        variant="outline"
        size="sm"
        className={isActive ? "shad-danger-btn" : "shad-primary-btn"}
        isLoading={isToggling}
        onClick={toggleActive}
      >
        {isActive ? "Desactivar" : "Reactivar"}
      </Button>
    </li>
  );
};
