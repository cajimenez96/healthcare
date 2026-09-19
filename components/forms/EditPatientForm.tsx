"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DoctorAvatar } from "@/components/DoctorAvatar";
import { Form, FormControl } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SelectItem } from "@/components/ui/select";
import {
  DEFAULT_INSURANCE_PROVIDER,
  GenderLabels,
  GenderOptions,
  IdentificationTypeLabels,
  IdentificationTypes,
} from "@/constants";
import { updatePatient } from "@/lib/actions/patient.actions";
import { PatientEditFormValidation } from "@/lib/validation";

import "react-datepicker/dist/react-datepicker.css";
import "react-phone-number-input/style.css";
import CustomFormField, { FormFieldType } from "../CustomFormField";
import { FileUploader } from "../FileUploader";
import { Button } from "../ui/button";

// TASK-059: edit counterpart to CreatePatientForm (TASK-024), reusing the
// exact same field set/validation (PatientEditFormValidation is an alias of
// CreatePatientFormValidation, see lib/validation.ts) — same "editable
// fields = what the create form collects" scope the ticket asked for.
// Identification number stays editable here on purpose (typos happen), and
// the scanned document is optional-to-replace (mirrors EditDoctorForm's
// "leave it as-is unless provided" photo pattern, TASK-034/036) rather than
// required again.
interface EditPatientFormProps {
  patient: {
    $id: string;
    name: string;
    email: string;
    phone: string;
    birthDate: string | Date;
    gender: Gender;
    address: string;
    occupation: string;
    emergencyContactName?: string;
    emergencyContactNumber?: string;
    primaryPhysician: string;
    insuranceProvider?: string;
    insurancePolicyNumber?: string;
    identificationType?: string;
    identificationNumber?: string;
  };
  doctors: { name: string; image?: string }[];
  insuranceProviders: { name: string }[];
  onDone: () => void;
}

export const EditPatientForm = ({
  patient,
  doctors,
  insuranceProviders,
  onDone,
}: EditPatientFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof PatientEditFormValidation>>({
    resolver: zodResolver(PatientEditFormValidation),
    defaultValues: {
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      birthDate: new Date(patient.birthDate),
      gender: patient.gender,
      address: patient.address,
      occupation: patient.occupation,
      emergencyContactName: patient.emergencyContactName ?? "",
      emergencyContactNumber: patient.emergencyContactNumber ?? "",
      primaryPhysician: patient.primaryPhysician,
      insuranceProvider:
        patient.insuranceProvider ?? DEFAULT_INSURANCE_PROVIDER,
      insurancePolicyNumber: patient.insurancePolicyNumber ?? "",
      identificationType: patient.identificationType ?? "DNI",
      identificationNumber: patient.identificationNumber ?? "",
      identificationDocument: [],
    },
  });

  const onSubmit = async (
    values: z.infer<typeof PatientEditFormValidation>
  ) => {
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    const identificationFile = values.identificationDocument?.[0];
    if (identificationFile) {
      const blobFile = new Blob([identificationFile], {
        type: identificationFile.type,
      });
      formData.append("blobFile", blobFile);
      formData.append("fileName", identificationFile.name);
    }

    try {
      const updated = await updatePatient({
        id: patient.$id,
        name: values.name,
        email: values.email,
        phone: values.phone,
        birthDate: new Date(values.birthDate),
        gender: values.gender,
        address: values.address,
        occupation: values.occupation,
        emergencyContactName: values.emergencyContactName || undefined,
        emergencyContactNumber: values.emergencyContactNumber || undefined,
        primaryPhysician: values.primaryPhysician,
        insuranceProvider: values.insuranceProvider || undefined,
        insurancePolicyNumber: values.insurancePolicyNumber || undefined,
        identificationType: values.identificationType,
        identificationNumber: values.identificationNumber,
        identificationDocument: formData,
      });

      if (updated) {
        onDone();
      } else {
        setError("No se pudo actualizar el paciente. Intentá de nuevo.");
      }
    } catch (submitError) {
      console.error(submitError);
      setError("No se pudo actualizar el paciente. Intentá de nuevo.");
    }

    setIsLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && <p className="shad-error text-14-regular">{error}</p>}

        <section className="space-y-6">
          <CustomFormField
            fieldType={FormFieldType.INPUT}
            control={form.control}
            name="name"
            label="Nombre completo"
            placeholder="Juan Pérez"
            iconSrc="/assets/icons/user.svg"
            iconAlt="user"
          />

          <div className="flex flex-col gap-6 xl:flex-row">
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
          </div>

          <div className="flex flex-col gap-6 xl:flex-row">
            <CustomFormField
              fieldType={FormFieldType.DATE_PICKER}
              control={form.control}
              name="birthDate"
              label="Fecha de nacimiento"
            />

            <CustomFormField
              fieldType={FormFieldType.SKELETON}
              control={form.control}
              name="gender"
              label="Género"
              renderSkeleton={(field) => (
                <FormControl>
                  <RadioGroup
                    className="flex h-11 gap-6 xl:justify-between"
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    {GenderOptions.map((option, i) => (
                      <div key={option + i} className="radio-group">
                        <RadioGroupItem value={option} id={`edit-${option}`} />
                        <Label
                          htmlFor={`edit-${option}`}
                          className="cursor-pointer"
                        >
                          {GenderLabels[option] ?? option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
              )}
            />
          </div>

          <div className="flex flex-col gap-6 xl:flex-row">
            <CustomFormField
              fieldType={FormFieldType.INPUT}
              control={form.control}
              name="address"
              label="Dirección"
              placeholder="Av. Corrientes 1234, CABA"
            />

            <CustomFormField
              fieldType={FormFieldType.INPUT}
              control={form.control}
              name="occupation"
              label="Ocupación (opcional)"
              placeholder="Ingeniero de Software"
            />
          </div>

          <div className="flex flex-col gap-6 xl:flex-row">
            <CustomFormField
              fieldType={FormFieldType.INPUT}
              control={form.control}
              name="emergencyContactName"
              label="Nombre de contacto de emergencia (opcional)"
              placeholder="Nombre del responsable"
            />

            <CustomFormField
              fieldType={FormFieldType.PHONE_INPUT}
              control={form.control}
              name="emergencyContactNumber"
              label="Teléfono de contacto de emergencia (opcional)"
              placeholder="+5491123456789"
            />
          </div>
        </section>

        <section className="space-y-6">
          <CustomFormField
            fieldType={FormFieldType.SELECT}
            control={form.control}
            name="primaryPhysician"
            label="Médico de cabecera"
            placeholder="Seleccioná un médico"
          >
            {doctors.map((doctor, i) => (
              <SelectItem key={doctor.name + i} value={doctor.name}>
                <div className="flex cursor-pointer items-center gap-2">
                  <DoctorAvatar
                    name={doctor.name}
                    image={doctor.image}
                    size={32}
                  />
                  <p>{doctor.name}</p>
                </div>
              </SelectItem>
            ))}
          </CustomFormField>

          <div className="flex flex-col gap-6 xl:flex-row">
            <CustomFormField
              fieldType={FormFieldType.SELECT}
              control={form.control}
              name="insuranceProvider"
              label="Obra social (opcional)"
              placeholder="Seleccioná una obra social"
            >
              {insuranceProviders.map((provider) => (
                <SelectItem key={provider.name} value={provider.name}>
                  {provider.name}
                </SelectItem>
              ))}
            </CustomFormField>

            <CustomFormField
              fieldType={FormFieldType.INPUT}
              control={form.control}
              name="insurancePolicyNumber"
              label="N° de afiliado (opcional)"
              placeholder="ABC123456789"
            />
          </div>
        </section>

        <section className="space-y-6">
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
            fieldType={FormFieldType.SKELETON}
            control={form.control}
            name="identificationDocument"
            label="Nuevo documento escaneado (opcional, dejá igual si no lo cambiás)"
            renderSkeleton={(field) => (
              <FormControl>
                <FileUploader files={field.value} onChange={field.onChange} />
              </FormControl>
            )}
          />
        </section>

        <Button
          type="submit"
          className="shad-primary-btn w-full"
          isLoading={isLoading}
        >
          Guardar cambios
        </Button>
      </form>
    </Form>
  );
};

export default EditPatientForm;
