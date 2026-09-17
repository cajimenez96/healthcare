"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { type Dispatch, type SetStateAction, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form } from "@/components/ui/form";
import { createSecretariaAccess } from "@/lib/actions/secretaria.actions";
import { SecretariaFormValidation } from "@/lib/validation";

import CustomFormField, { FormFieldType } from "../CustomFormField";
import SubmitButton from "../SubmitButton";

interface CreateSecretariaFormProps {
  setOpen?: Dispatch<SetStateAction<boolean>>;
}

const CreateSecretariaForm = ({ setOpen }: CreateSecretariaFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof SecretariaFormValidation>>({
    resolver: zodResolver(SecretariaFormValidation),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof SecretariaFormValidation>) => {
    setIsLoading(true);
    setError(null);

    const user = await createSecretariaAccess(values.name, values.email, values.password);

    setIsLoading(false);

    if (user) {
      form.reset();
      router.refresh();
      setOpen?.(false);
    } else {
      setError("No se pudo crear el acceso. Verificá el email e intentá de nuevo.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="name"
          label="Nombre"
          placeholder="María López"
        />

        <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="email"
          label="Email de acceso"
          placeholder="secretaria@clinica.com"
        />

        <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="password"
          label="Contraseña"
          placeholder="••••••••"
          inputType="password"
        />

        {error && <p className="shad-error text-14-regular">{error}</p>}

        <SubmitButton isLoading={isLoading}>Crear acceso</SubmitButton>
      </form>
    </Form>
  );
};

export default CreateSecretariaForm;
