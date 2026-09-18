"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form, FormControl } from "@/components/ui/form";
import { updateDoctor } from "@/lib/actions/doctor.actions";
import { DoctorEditFormValidation } from "@/lib/validation";

import CustomFormField, { FormFieldType } from "../CustomFormField";
import { FileUploader } from "../FileUploader";
import SubmitButton from "../SubmitButton";

import { DoctorAvailabilityPicker } from "./DoctorAvailabilityPicker";

interface EditDoctorFormProps {
  doctor: {
    id: string;
    name: string;
    specialty: string;
    licenseNumber: string;
    image?: string;
    availability: { dayOfWeek: number; startTime: string; endTime: string }[];
  };
  onDone: () => void;
}

const EditDoctorForm = ({ doctor, onDone }: EditDoctorFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof DoctorEditFormValidation>>({
    resolver: zodResolver(DoctorEditFormValidation),
    defaultValues: {
      name: doctor.name,
      specialty: doctor.specialty,
      licenseNumber: doctor.licenseNumber,
      availability: doctor.availability,
    },
  });

  const onSubmit = async (values: z.infer<typeof DoctorEditFormValidation>) => {
    setIsLoading(true);

    let photo: FormData | undefined;
    if (values.photo && values.photo.length > 0) {
      const blobFile = new Blob([values.photo[0]], { type: values.photo[0].type });
      photo = new FormData();
      photo.append("blobFile", blobFile);
      photo.append("fileName", values.photo[0].name);
    }

    const updated = await updateDoctor({
      id: doctor.id,
      name: values.name,
      specialty: values.specialty,
      licenseNumber: values.licenseNumber,
      availability: values.availability,
      existingImage: doctor.image,
      photo,
    });

    setIsLoading(false);

    if (updated) {
      router.refresh();
      onDone();
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
          name="specialty"
          label="Especialidad"
        />

        <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="licenseNumber"
          label="Matrícula"
        />

        <CustomFormField
          fieldType={FormFieldType.SKELETON}
          control={form.control}
          name="photo"
          label="Nueva foto (opcional, deja igual si no la cambiás)"
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

        <SubmitButton isLoading={isLoading}>Guardar cambios</SubmitButton>
      </form>
    </Form>
  );
};

export default EditDoctorForm;
