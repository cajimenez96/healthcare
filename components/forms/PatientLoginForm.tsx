"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form } from "@/components/ui/form";
import { PatientLoginValidation } from "@/lib/validation";

import CustomFormField, { FormFieldType } from "../CustomFormField";
import SubmitButton from "../SubmitButton";

const PatientLoginForm = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof PatientLoginValidation>>({
    resolver: zodResolver(PatientLoginValidation),
    defaultValues: { identificationNumber: "", pin: "" },
  });

  const onSubmit = async (values: z.infer<typeof PatientLoginValidation>) => {
    setIsLoading(true);
    setError(null);

    const result = await signIn("patient-credentials", {
      identificationNumber: values.identificationNumber,
      pin: values.pin,
      redirect: false,
    });

    if (!result || result.error) {
      setError("Número de identificación o PIN incorrectos.");
      setIsLoading(false);
      return;
    }

    const session = await getSession();
    router.push(session?.user?.id ? `/patients/${session.user.id}/new-appointment` : "/");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-6">
        <section className="mb-6 space-y-1">
          <h1 className="header">Iniciar sesión</h1>
          <p className="text-dark-700">Ingresá con tu número de identificación y tu PIN.</p>
        </section>

        <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="identificationNumber"
          label="Número de identificación"
          placeholder="30111222"
        />

        <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="pin"
          label="PIN"
          placeholder="••••"
          inputType="password"
        />

        {error && <p className="shad-error text-14-regular">{error}</p>}

        <SubmitButton isLoading={isLoading}>Ingresar</SubmitButton>
      </form>
    </Form>
  );
};

export default PatientLoginForm;
