"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form } from "@/components/ui/form";
import { updateSecretaria } from "@/lib/actions/secretaria.actions";
import { SecretariaEditFormValidation } from "@/lib/validation";

import CustomFormField, { FormFieldType } from "../CustomFormField";
import SubmitButton from "../SubmitButton";

interface EditSecretariaFormProps {
  secretaria: {
    id: string;
    name: string;
    email: string;
  };
  onDone: () => void;
}

const EditSecretariaForm = ({ secretaria, onDone }: EditSecretariaFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof SecretariaEditFormValidation>>({
    resolver: zodResolver(SecretariaEditFormValidation),
    defaultValues: {
      name: secretaria.name,
      email: secretaria.email,
    },
  });

  const onSubmit = async (
    values: z.infer<typeof SecretariaEditFormValidation>,
  ) => {
    setIsLoading(true);
    setError(null);

    const result = await updateSecretaria(
      secretaria.id,
      values.name,
      values.email,
    );

    setIsLoading(false);

    if (result && "error" in result) {
      setError(
        result.error === "EMAIL_TAKEN"
          ? "Ese email ya está en uso por otro usuario."
          : "No se pudo actualizar. Intentá de nuevo.",
      );
      return;
    }

    if (result) {
      router.refresh();
      onDone();
    } else {
      setError("No se pudo actualizar. Intentá de nuevo.");
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
        />

        <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="email"
          label="Email"
        />

        {error && <p className="shad-error text-14-regular">{error}</p>}

        <SubmitButton isLoading={isLoading}>Guardar cambios</SubmitButton>
      </form>
    </Form>
  );
};

export default EditSecretariaForm;
