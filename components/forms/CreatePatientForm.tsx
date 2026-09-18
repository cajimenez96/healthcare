"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { type Dispatch, type SetStateAction, useState } from "react";
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
import { createPatient } from "@/lib/actions/patient.actions";
import { CreatePatientFormValidation } from "@/lib/validation";

import "react-datepicker/dist/react-datepicker.css";
import "react-phone-number-input/style.css";
import CustomFormField, { FormFieldType } from "../CustomFormField";
import { FileUploader } from "../FileUploader";
import SubmitButton from "../SubmitButton";

// TASK-024: staff-side patient creation, used from both /recepcion and
// /admin (two thin pages mount this same form — see
// app/recepcion/pacientes/nuevo/page.tsx and app/admin/pacientes/nuevo/page.tsx).
// Adapted from RegisterForm.tsx's field set, but with no dependency on a
// pre-existing User (there is none — patients have no login, TASK-023).
//
// TASK-039: `setOpen`/`defaultName`/`defaultIdentificationNumber` are
// optional additions for the Dialog usage from PatientsList's
// search-then-create flow (same `setOpen?` convention TASK-034 used on
// CreateSecretariaForm etc.) — the two standalone `/nuevo` pages above don't
// pass them, so they keep behaving exactly as before.
export const CreatePatientForm = ({
  doctors,
  insuranceProviders,
  setOpen,
  defaultName,
  defaultIdentificationNumber,
  onCreated,
}: {
  doctors: { name: string; image?: string }[];
  insuranceProviders: { name: string }[];
  setOpen?: Dispatch<SetStateAction<boolean>>;
  defaultName?: string;
  defaultIdentificationNumber?: string;
  // TASK-043: optional hook for a caller that wants the newly-created
  // patient back (e.g. "Nuevo turno" auto-selecting them for booking right
  // away) instead of just refreshing/closing. Additive — every existing
  // caller that doesn't pass it keeps behaving exactly as before.
  onCreated?: (patient: { $id: string; name: string }) => void;
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdPatientName, setCreatedPatientName] = useState<string | null>(null);

  const form = useForm<z.infer<typeof CreatePatientFormValidation>>({
    resolver: zodResolver(CreatePatientFormValidation),
    defaultValues: {
      name: defaultName ?? "",
      email: "",
      phone: "",
      gender: "Male",
      address: "",
      occupation: "",
      emergencyContactName: "",
      emergencyContactNumber: "",
      primaryPhysician: "",
      insuranceProvider: DEFAULT_INSURANCE_PROVIDER,
      insurancePolicyNumber: "",
      identificationType: "National Identity Card",
      identificationNumber: defaultIdentificationNumber ?? "",
      identificationDocument: [],
    },
  });

  const onSubmit = async (values: z.infer<typeof CreatePatientFormValidation>) => {
    setIsLoading(true);
    setError(null);
    setCreatedPatientName(null);

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
      const newPatient = await createPatient({
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

      if (newPatient) {
        setCreatedPatientName(newPatient.name);
        form.reset();
        router.refresh();
        setOpen?.(false);
        onCreated?.({ $id: newPatient.$id, name: newPatient.name });
      } else {
        setError("No se pudo crear el paciente. Intentá de nuevo.");
      }
    } catch (submitError) {
      console.log(submitError);
      setError("No se pudo crear el paciente. Intentá de nuevo.");
    }

    setIsLoading(false);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex-1 space-y-12"
      >
        <section className="space-y-4">
          <h1 className="header">Nuevo paciente</h1>
          <p className="text-dark-700">Cargá los datos del paciente.</p>
        </section>

        {createdPatientName && (
          <p className="text-14-regular text-green-500">
            Paciente {createdPatientName} creado con éxito.
          </p>
        )}
        {error && <p className="shad-error text-14-regular">{error}</p>}

        <section className="space-y-6">
          <div className="mb-9 space-y-1">
            <h2 className="sub-header">Información Personal</h2>
          </div>

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
                        <RadioGroupItem value={option} id={option} />
                        <Label htmlFor={option} className="cursor-pointer">
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
              label="Ocupación"
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
          <div className="mb-9 space-y-1">
            <h2 className="sub-header">Información Médica</h2>
          </div>

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
                  <DoctorAvatar name={doctor.name} image={doctor.image} size={32} />
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
          <div className="mb-9 space-y-1">
            <h2 className="sub-header">Documento de identidad</h2>
          </div>

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
            label="Copia escaneada del documento de identificación (opcional)"
            renderSkeleton={(field) => (
              <FormControl>
                <FileUploader files={field.value} onChange={field.onChange} />
              </FormControl>
            )}
          />
        </section>

        <SubmitButton isLoading={isLoading}>Crear paciente</SubmitButton>
      </form>
    </Form>
  );
};

export default CreatePatientForm;
