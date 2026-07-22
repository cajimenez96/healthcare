"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form } from "@/components/ui/form";
import { getRoleHomeRoute } from "@/lib/auth/roleHomeRoute";
import { LoginFormValidation } from "@/lib/validation";

import CustomFormField, { FormFieldType } from "../CustomFormField";
import SubmitButton from "../SubmitButton";

const LoginForm = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof LoginFormValidation>>({
    resolver: zodResolver(LoginFormValidation),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof LoginFormValidation>) => {
    setIsLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (!result || result.error) {
      setError("Email o contraseña incorrectos.");
      setIsLoading(false);
      return;
    }

    const session = await getSession();
    router.push(session?.user?.role ? getRoleHomeRoute(session.user.role) : "/");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-6">
        <section className="mb-6 space-y-1">
          <h1 className="header">Iniciar sesión</h1>
          <p className="text-dark-700">Acceso para personal del staff.</p>
        </section>

        <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="email"
          label="Email"
          placeholder="nombre@clinica.com"
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

        <SubmitButton isLoading={isLoading}>Ingresar</SubmitButton>
      </form>
    </Form>
  );
};

export default LoginForm;
