"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { type Dispatch, type SetStateAction, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form } from "@/components/ui/form";
import { createAdminAccess } from "@/lib/actions/adminUser.actions";
import { AdminFormValidation } from "@/lib/validation";

import CustomFormField, { FormFieldType } from "../CustomFormField";
import { Button } from "../ui/button";

interface CreateAdminFormProps {
  setOpen?: Dispatch<SetStateAction<boolean>>;
}

const CreateAdminForm = ({ setOpen }: CreateAdminFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof AdminFormValidation>>({
    resolver: zodResolver(AdminFormValidation),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof AdminFormValidation>) => {
    setIsLoading(true);
    setError(null);

    const user = await createAdminAccess(values.name, values.email, values.password);

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
          placeholder="Juan Pérez"
        />

        <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="email"
          label="Email de acceso"
          placeholder="admin@clinica.com"
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

        <Button type="submit" className="shad-primary-btn w-full" isLoading={isLoading}>
          Crear acceso
        </Button>
      </form>
    </Form>
  );
};

export default CreateAdminForm;
