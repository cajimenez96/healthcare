"use client";

import { useState } from "react";

import { MedicalBackgroundForm } from "@/components/forms/MedicalBackgroundForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MedicalBackgroundEditorProps {
  patientId: string;
  allergies?: string;
  currentMedication?: string;
  familyMedicalHistory?: string;
  pastMedicalHistory?: string;
}

// TASK-069: the doctor patient page (a Server Component) can't hold Dialog
// open state itself — this thin client wrapper is the trigger + Dialog,
// same pattern as PatientRow.tsx's "Editar paciente".
export const MedicalBackgroundEditor = ({
  patientId,
  allergies,
  currentMedication,
  familyMedicalHistory,
  pastMedicalHistory,
}: MedicalBackgroundEditorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          Editar antecedentes
        </Button>
      </DialogTrigger>
      <DialogContent className="shad-dialog max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader className="mb-4">
          <DialogTitle>Editar antecedentes médicos</DialogTitle>
        </DialogHeader>
        <MedicalBackgroundForm
          patientId={patientId}
          allergies={allergies}
          currentMedication={currentMedication}
          familyMedicalHistory={familyMedicalHistory}
          pastMedicalHistory={pastMedicalHistory}
          onDone={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
