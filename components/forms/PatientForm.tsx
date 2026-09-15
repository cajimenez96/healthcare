"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form } from "@/components/ui/form";
import { SelectItem } from "@/components/ui/select";
import { IdentificationTypeLabels, IdentificationTypes } from "@/constants";
import { createUser } from "@/lib/actions/patient.actions";
import { UserFormValidation } from "@/lib/validation";

import "react-phone-number-input/style.css";
import CustomFormField, { FormFieldType } from "../CustomFormField";
import SubmitButton from "../SubmitButton";

export const PatientForm = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof UserFormValidation>>({
    resolver: zodResolver(UserFormValidation),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      identificationType: "",
      identificationNumber: "",
      pin: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof UserFormValidation>) => {
    setIsLoading(true);
    setError(null);

    try {
      const user = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        identificationType: values.identificationType,
        identificationNumber: values.identificationNumber,
      };

      const newUser = await createUser(user, values.pin);

      if (!newUser) {
        setError("No se pudo crear tu cuenta. Intentá de nuevo.");
        setIsLoading(false);
        return;
      }

      // Sign in right away, with the credentials just typed (not the
      // guessable $id) — this is what actually protects the following
      // /patients/[userId]/** steps: from here on, access requires a real
      // session that matches this specific patient, not just knowing the URL.
      const result = await signIn("patient-credentials", {
        identificationNumber: values.identificationNumber,
        pin: values.pin,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Tu cuenta se creó, pero no pudimos iniciar sesión. Probá ingresar desde /patients/login.");
        setIsLoading(false);
        return;
      }

      router.push(`/patients/${newUser.$id}/register`);
    } catch (error) {
      console.log(error);
      setError("No se pudo crear tu cuenta. Intentá de nuevo.");
    }

    setIsLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-6">
        <section className="mb-12 space-y-4">
          <h1 className="header">¡Hola! 👋</h1>
          <p className="text-dark-700">Empecemos con tus turnos.</p>
        </section>

        <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="name"
          label="Nombre completo"
          placeholder="Juan Pérez"
          iconSrc="/assets/icons/user.svg"
          iconAlt="user"
        />

        <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="email"
          label="Correo electrónico"
          placeholder="juanperez@gmail.com"
          iconSrc="/assets/icons/email.svg"
          iconAlt="email"
        />

        <CustomFormField
          fieldType={FormFieldType.PHONE_INPUT}
          control={form.control}
          name="phone"
          label="Número de teléfono"
          placeholder="+5491123456789"
        />

        <CustomFormField
          fieldType={FormFieldType.SELECT}
          control={form.control}
          name="identificationType"
          label="Tipo de identificación"
          placeholder="Seleccioná el tipo de identificación"
        >
          {IdentificationTypes.map((type, i) => (
            <SelectItem key={type + i} value={type}>
              {IdentificationTypeLabels[type] ?? type}
            </SelectItem>
          ))}
        </CustomFormField>

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
          label="Elegí un PIN de acceso (4 a 6 dígitos)"
          placeholder="1234"
          inputType="password"
        />

        {error && <p className="shad-error text-14-regular">{error}</p>}

        <SubmitButton isLoading={isLoading}>Comenzar</SubmitButton>
      </form>
    </Form>
  );
};
