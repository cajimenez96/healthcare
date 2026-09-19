"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { updatePatientMedicalBackground } from "@/lib/actions/patient.actions";
import { MedicalBackgroundFormValidation } from "@/lib/validation";

import CustomFormField, { FormFieldType } from "../CustomFormField";
import { Button } from "../ui/button";
import { Form } from "../ui/form";

interface MedicalBackgroundFormProps {
  patientId: string;
  allergies?: string;
  currentMedication?: string;
  familyMedicalHistory?: string;
  pastMedicalHistory?: string;
  onDone: () => void;
}

// TASK-069: the doctor-facing counterpart to EditPatientForm (Secretaria/
// Admin) — scoped only to the 4 antecedentes médicos fields, which nobody
// could edit at all before this ticket.
export const MedicalBackgroundForm = ({
  patientId,
  allergies,
  currentMedication,
  familyMedicalHistory,
  pastMedicalHistory,
  onDone,
}: MedicalBackgroundFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof MedicalBackgroundFormValidation>>({
    resolver: zodResolver(MedicalBackgroundFormValidation),
    defaultValues: {
      allergies: allergies ?? "",
      currentMedication: currentMedication ?? "",
      familyMedicalHistory: familyMedicalHistory ?? "",
      pastMedicalHistory: pastMedicalHistory ?? "",
    },
  });

  const onSubmit = async (
    values: z.infer<typeof MedicalBackgroundFormValidation>,
  ) => {
    setIsLoading(true);
    const updated = await updatePatientMedicalBackground({
      id: patientId,
      ...values,
    });
    setIsLoading(false);

    if (updated) {
      onDone();
      router.refresh();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <CustomFormField
          fieldType={FormFieldType.TEXTAREA}
          control={form.control}
          name="allergies"
          label="Alergias"
          placeholder="Penicilina, polen..."
        />
        <CustomFormField
          fieldType={FormFieldType.TEXTAREA}
          control={form.control}
          name="currentMedication"
          label="Medicación actual"
          placeholder="Ibuprofeno 400mg cada 8hs"
        />
        <CustomFormField
          fieldType={FormFieldType.TEXTAREA}
          control={form.control}
          name="familyMedicalHistory"
          label="Antecedentes familiares"
          placeholder="Diabetes materna, hipertensión paterna..."
        />
        <CustomFormField
          fieldType={FormFieldType.TEXTAREA}
          control={form.control}
          name="pastMedicalHistory"
          label="Antecedentes personales"
          placeholder="Apendicectomía 2015..."
        />

        <Button type="submit" className="shad-primary-btn w-full" isLoading={isLoading}>
          Guardar antecedentes
        </Button>
      </form>
    </Form>
  );
};
