"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form, FormControl } from "@/components/ui/form";
import { createDoctor } from "@/lib/actions/doctor.actions";
import { DoctorFormValidation } from "@/lib/validation";

import CustomFormField, { FormFieldType } from "../CustomFormField";
import { FileUploader } from "../FileUploader";
import SubmitButton from "../SubmitButton";

import { DoctorAvailabilityPicker } from "./DoctorAvailabilityPicker";

interface DoctorFormProps {
  onDone?: () => void;
}

const DoctorForm = ({ onDone }: DoctorFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof DoctorFormValidation>>({
    resolver: zodResolver(DoctorFormValidation),
    defaultValues: {
      name: "",
      specialty: "",
      licenseNumber: "",
      availability: [],
    },
  });

  const onSubmit = async (values: z.infer<typeof DoctorFormValidation>) => {
    setIsLoading(true);

    const photo = new FormData();
    const photoFile = values.photo?.[0];
    if (photoFile) {
      const blobFile = new Blob([photoFile], { type: photoFile.type });
      photo.append("blobFile", blobFile);
      photo.append("fileName", photoFile.name);
    }

    const doctor = await createDoctor({
      name: values.name,
      specialty: values.specialty,
      licenseNumber: values.licenseNumber,
      availability: values.availability,
      photo,
    });

    setIsLoading(false);

    if (doctor) {
      form.reset();
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
          placeholder="Dra. Jane Powell"
        />

        <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="specialty"
          label="Especialidad"
          placeholder="Odontología General"
        />

        <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="licenseNumber"
          label="Matrícula"
          placeholder="MP-12345"
        />

        <CustomFormField
          fieldType={FormFieldType.SKELETON}
          control={form.control}
          name="photo"
          label="Foto (opcional)"
          renderSkeleton={(field) => (
            <FormControl>
              <FileUploader files={field.value} onChange={field.onChange} />
            </FormControl>
          )}
        />

        <CustomFormField
          fieldType={FormFieldType.SKELETON}
          control={form.control}
          name="availability"
          label="Días y horario de atención"
          renderSkeleton={(field) => (
            <FormControl>
              <DoctorAvailabilityPicker
                value={field.value ?? []}
                onChange={field.onChange}
              />
            </FormControl>
          )}
        />

        <SubmitButton isLoading={isLoading}>Crear doctor</SubmitButton>
      </form>
    </Form>
  );
};

export default DoctorForm;
