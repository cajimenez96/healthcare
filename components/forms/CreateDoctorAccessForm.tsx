"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form } from "@/components/ui/form";
import { createDoctorAccess } from "@/lib/actions/doctor.actions";
import { LoginFormValidation } from "@/lib/validation";

import CustomFormField, { FormFieldType } from "../CustomFormField";
import SubmitButton from "../SubmitButton";

interface CreateDoctorAccessFormProps {
  doctorId: string;
  onDone: () => void;
}

const CreateDoctorAccessForm = ({ doctorId, onDone }: CreateDoctorAccessFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof LoginFormValidation>>({
    resolver: zodResolver(LoginFormValidation),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof LoginFormValidation>) => {
    setIsLoading(true);
    setError(null);

    const result = await createDoctorAccess(doctorId, values.email, values.password);

    setIsLoading(false);

    if (result && "error" in result && result.error === "ALREADY_HAS_ACCESS") {
      setError("Este doctor ya tiene un acceso creado. No se puede crear un segundo login.");
    } else if (result) {
      onDone();
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
          name="email"
          label="Email de acceso"
          placeholder="doctor@clinica.com"
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

export default CreateDoctorAccessForm;
