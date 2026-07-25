"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { SelectItem } from "@/components/ui/select";
import {
  createAppointment,
  getAvailableSlotsForDoctor,
  updateAppointment,
} from "@/lib/actions/appointment.actions";
import { getAppointmentSchema } from "@/lib/validation";
import { Appointment } from "@/types/appwrite.types";

import "react-datepicker/dist/react-datepicker.css";

import CustomFormField, { FormFieldType } from "../CustomFormField";
import SubmitButton from "../SubmitButton";
import { Form } from "../ui/form";

interface DoctorAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface DoctorOption {
  name: string;
  image: string;
  availability?: DoctorAvailability[];
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export const AppointmentForm = ({
  userId,
  patientId,
  type = "create",
  appointment,
  setOpen,
  doctors,
}: {
  userId: string;
  patientId: string;
  type: "create" | "schedule" | "cancel";
  appointment?: Appointment;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  doctors: DoctorOption[];
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [availableTimes, setAvailableTimes] = useState<Date[] | null>(null);

  const AppointmentFormValidation = getAppointmentSchema(type);

  const form = useForm<z.infer<typeof AppointmentFormValidation>>({
    resolver: zodResolver(AppointmentFormValidation),
    defaultValues: {
      primaryPhysician: appointment ? appointment?.primaryPhysician : "",
      schedule: appointment
        ? new Date(appointment?.schedule!)
        : new Date(Date.now()),
      reason: appointment ? appointment.reason : "",
      note: appointment?.note || "",
      cancellationReason: appointment?.cancellationReason || "",
    },
  });

  const selectedDoctorName = form.watch("primaryPhysician" as any) as
    | string
    | undefined;
  const selectedDate = form.watch("schedule" as any) as Date | undefined;
  const selectedDoctor = doctors.find((doctor) => doctor.name === selectedDoctorName);

  useEffect(() => {
    if (!selectedDoctorName || !selectedDate || type === "cancel") {
      setAvailableTimes(null);
      return;
    }

    let cancelled = false;
    getAvailableSlotsForDoctor(selectedDoctorName, selectedDate).then((slots: string[]) => {
      if (cancelled) return;
      setAvailableTimes(
        slots.map((slot) => {
          const [hours, minutes] = slot.split(":").map(Number);
          const time = new Date(selectedDate);
          time.setHours(hours, minutes, 0, 0);
          return time;
        }),
      );
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDoctorName, selectedDate && dayKey(selectedDate)]);

  const onSubmit = async (
    values: z.infer<typeof AppointmentFormValidation>
  ) => {
    setIsLoading(true);
    setSubmitError(null);

    let status;
    switch (type) {
      case "schedule":
        status = "scheduled";
        break;
      case "cancel":
        status = "cancelled";
        break;
      default:
        status = "pending";
    }

    try {
      if (type === "create" && patientId) {
        const appointment = {
          userId,
          patient: patientId,
          primaryPhysician: values.primaryPhysician,
          schedule: new Date(values.schedule),
          reason: values.reason!,
          status: status as Status,
          note: values.note,
        };

        const newAppointment = await createAppointment(appointment);

        if (newAppointment) {
          form.reset();
          router.push(
            `/patients/${userId}/new-appointment/success?appointmentId=${newAppointment.$id}`
          );
        } else {
          setSubmitError(
            "No se pudo guardar el turno. Es posible que el horario ya no esté disponible — elegí otro e intentá de nuevo."
          );
        }
      } else {
        const appointmentToUpdate = {
          userId,
          appointmentId: appointment?.$id!,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          appointment: {
            primaryPhysician: values.primaryPhysician,
            schedule: new Date(values.schedule),
            status: status as Status,
            cancellationReason: values.cancellationReason,
          },
          type,
        };

        const updatedAppointment = await updateAppointment(appointmentToUpdate);

        if (updatedAppointment) {
          setOpen && setOpen(false);
          form.reset();
        } else if (type === "schedule") {
          setSubmitError(
            "No se pudo guardar el turno. Es posible que el horario ya no esté disponible — elegí otro e intentá de nuevo."
          );
        }
      }
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  };

  let buttonLabel;
  switch (type) {
    case "cancel":
      buttonLabel = "Cancelar turno";
      break;
    case "schedule":
      buttonLabel = "Confirmar turno";
      break;
    default:
      buttonLabel = "Solicitar turno";
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-6">
        {type === "create" && (
          <section className="mb-12 space-y-4">
            <h1 className="header">Nuevo turno</h1>
            <p className="text-dark-700">
              Solicitá un turno nuevo en 10 segundos.
            </p>
          </section>
        )}

        {type !== "cancel" && (
          <>
            <CustomFormField
              fieldType={FormFieldType.SELECT}
              control={form.control}
              name="primaryPhysician"
              label="Doctor"
              placeholder="Seleccioná un doctor"
            >
              {doctors.map((doctor, i) => (
                <SelectItem key={doctor.name + i} value={doctor.name}>
                  <div className="flex cursor-pointer items-center gap-2">
                    <Image
                      src={doctor.image}
                      width={32}
                      height={32}
                      alt="doctor"
                      className="rounded-full border border-dark-500"
                    />
                    <p>{doctor.name}</p>
                  </div>
                </SelectItem>
              ))}
            </CustomFormField>

            <CustomFormField
              fieldType={FormFieldType.DATE_PICKER}
              control={form.control}
              name="schedule"
              label="Fecha estimada del turno"
              showTimeSelect
              dateFormat="MM/dd/yyyy  -  h:mm aa"
              includeTimes={availableTimes ?? undefined}
              filterDate={
                selectedDoctor?.availability
                  ? (date: Date) =>
                      selectedDoctor.availability!.some(
                        (entry) => entry.dayOfWeek === date.getDay(),
                      )
                  : undefined
              }
            />

            <div
              className={`flex flex-col gap-6  ${type === "create" && "xl:flex-row"}`}
            >
              <CustomFormField
                fieldType={FormFieldType.TEXTAREA}
                control={form.control}
                name="reason"
                label="Motivo del turno"
                placeholder="Control anual"
                disabled={type === "schedule"}
              />

              <CustomFormField
                fieldType={FormFieldType.TEXTAREA}
                control={form.control}
                name="note"
                label="Comentarios/notas"
                placeholder="Preferentemente por la tarde, si es posible"
                disabled={type === "schedule"}
              />
            </div>
          </>
        )}

        {type === "cancel" && (
          <CustomFormField
            fieldType={FormFieldType.TEXTAREA}
            control={form.control}
            name="cancellationReason"
            label="Motivo de la cancelación"
            placeholder="Surgió un compromiso urgente"
          />
        )}

        {submitError && (
          <p className="shad-error text-14-regular">{submitError}</p>
        )}

        <SubmitButton
          isLoading={isLoading}
          className={`${type === "cancel" ? "shad-danger-btn" : "shad-primary-btn"} w-full`}
        >
          {buttonLabel}
        </SubmitButton>
      </form>
    </Form>
  );
};
