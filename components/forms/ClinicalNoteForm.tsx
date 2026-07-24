"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form } from "@/components/ui/form";
import { createClinicalNote } from "@/lib/actions/clinicalNote.actions";
import { ClinicalNoteValidation } from "@/lib/validation";

import CustomFormField, { FormFieldType } from "../CustomFormField";
import SubmitButton from "../SubmitButton";

interface ClinicalNoteFormProps {
  patientId: string;
  appointmentId: string;
}

const ClinicalNoteForm = ({ patientId, appointmentId }: ClinicalNoteFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof ClinicalNoteValidation>>({
    resolver: zodResolver(ClinicalNoteValidation),
    defaultValues: { note: "" },
  });

  const onSubmit = async (values: z.infer<typeof ClinicalNoteValidation>) => {
    setIsLoading(true);
    setError(null);

    const created = await createClinicalNote(patientId, appointmentId, values.note);

    setIsLoading(false);

    if (created) {
      form.reset();
      router.refresh();
    } else {
      setError("No se pudo guardar la nota. Intentá de nuevo.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <CustomFormField
          fieldType={FormFieldType.TEXTAREA}
          control={form.control}
          name="note"
          label="Nota de evolución"
          placeholder="Anamnesis, hallazgos, tratamiento realizado..."
        />

        {error && <p className="shad-error text-14-regular">{error}</p>}

        <SubmitButton isLoading={isLoading}>Guardar evolución</SubmitButton>
      </form>
    </Form>
  );
};

export default ClinicalNoteForm;
