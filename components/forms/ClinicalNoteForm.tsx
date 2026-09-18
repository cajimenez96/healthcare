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
import { Button } from "../ui/button";

interface ClinicalNoteFormProps {
  patientId: string;
  appointmentId: string;
  treatments: { id: string; name: string; price: number }[];
}

const ClinicalNoteForm = ({ patientId, appointmentId, treatments }: ClinicalNoteFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTreatmentIds, setSelectedTreatmentIds] = useState<string[]>([]);

  const form = useForm<z.infer<typeof ClinicalNoteValidation>>({
    resolver: zodResolver(ClinicalNoteValidation),
    defaultValues: { note: "" },
  });

  const toggleTreatment = (treatmentId: string) => {
    setSelectedTreatmentIds((current) =>
      current.includes(treatmentId)
        ? current.filter((id) => id !== treatmentId)
        : [...current, treatmentId],
    );
  };

  const onSubmit = async (values: z.infer<typeof ClinicalNoteValidation>) => {
    setIsLoading(true);
    setError(null);

    const performedTreatments = treatments
      .filter((treatment) => selectedTreatmentIds.includes(treatment.id))
      .map((treatment) => ({
        treatmentId: treatment.id,
        name: treatment.name,
        price: treatment.price,
      }));

    const created = await createClinicalNote(
      patientId,
      appointmentId,
      values.note,
      performedTreatments,
    );

    setIsLoading(false);

    if (created) {
      form.reset();
      setSelectedTreatmentIds([]);
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

        {treatments.length > 0 && (
          <div className="space-y-2">
            <p className="text-14-medium">Prestaciones realizadas</p>
            <div className="space-y-2">
              {treatments.map((treatment) => (
                <label
                  key={treatment.id}
                  className="text-14-regular flex cursor-pointer items-center gap-2"
                >
                  <input
                    type="checkbox"
                    checked={selectedTreatmentIds.includes(treatment.id)}
                    onChange={() => toggleTreatment(treatment.id)}
                  />
                  {treatment.name} — ${treatment.price.toLocaleString("es-AR")}
                </label>
              ))}
            </div>
          </div>
        )}

        {error && <p className="shad-error text-14-regular">{error}</p>}

        <Button type="submit" className="shad-primary-btn w-full" isLoading={isLoading}>
          Guardar evolución
        </Button>
      </form>
    </Form>
  );
};

export default ClinicalNoteForm;
