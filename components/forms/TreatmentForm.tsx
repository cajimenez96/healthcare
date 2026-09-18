"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form } from "@/components/ui/form";
import { createTreatment, updateTreatment } from "@/lib/actions/treatment.actions";
import { TreatmentFormValidation } from "@/lib/validation";

import CustomFormField, { FormFieldType } from "../CustomFormField";
import SubmitButton from "../SubmitButton";

interface TreatmentFormProps {
  treatment?: {
    id: string;
    name: string;
    price: number;
    description?: string;
    estimatedDurationMinutes: number;
  };
  onDone?: () => void;
}

const TreatmentForm = ({ treatment, onDone }: TreatmentFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof TreatmentFormValidation>>({
    resolver: zodResolver(TreatmentFormValidation),
    defaultValues: {
      name: treatment?.name ?? "",
      price: treatment?.price ?? 0,
      estimatedDurationMinutes: treatment?.estimatedDurationMinutes ?? 30,
      description: treatment?.description ?? "",
    },
  });

  const onSubmit = async (values: z.infer<typeof TreatmentFormValidation>) => {
    setIsLoading(true);

    const result = treatment
      ? await updateTreatment(treatment.id, values)
      : await createTreatment(values);

    setIsLoading(false);

    if (result) {
      if (!treatment) {
        form.reset();
      }
      router.refresh();
      onDone?.();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="name"
          label="Nombre"
          placeholder="Consulta Odontológica"
        />

        <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="price"
          label="Precio"
          placeholder="5000"
          inputType="number"
        />

        <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="estimatedDurationMinutes"
          label="Duración estimada (minutos)"
          placeholder="30"
          inputType="number"
        />

        <CustomFormField
          fieldType={FormFieldType.TEXTAREA}
          control={form.control}
          name="description"
          label="Descripción (opcional)"
          placeholder="Detalle de la prestación"
        />

        <SubmitButton isLoading={isLoading}>
          {treatment ? "Guardar cambios" : "Crear prestación"}
        </SubmitButton>
      </form>
    </Form>
  );
};

export default TreatmentForm;
