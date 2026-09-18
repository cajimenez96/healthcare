"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form } from "@/components/ui/form";
import { updateAdmin } from "@/lib/actions/adminUser.actions";
import { AdminEditFormValidation } from "@/lib/validation";

import CustomFormField, { FormFieldType } from "../CustomFormField";
import { Button } from "../ui/button";

interface EditAdminFormProps {
  admin: {
    id: string;
    name: string;
    email: string;
  };
  onDone: () => void;
}

const EditAdminForm = ({ admin, onDone }: EditAdminFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof AdminEditFormValidation>>({
    resolver: zodResolver(AdminEditFormValidation),
    defaultValues: {
      name: admin.name,
      email: admin.email,
    },
  });

  const onSubmit = async (
    values: z.infer<typeof AdminEditFormValidation>,
  ) => {
    setIsLoading(true);
    setError(null);

    const result = await updateAdmin(admin.id, values.name, values.email);

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

        <Button type="submit" className="shad-primary-btn w-full" isLoading={isLoading}>
          Guardar cambios
        </Button>
      </form>
    </Form>
  );
};

export default EditAdminForm;
