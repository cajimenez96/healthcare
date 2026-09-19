"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DoctorAvatar } from "@/components/DoctorAvatar";
import { OutOfAvailabilityAlertDialog } from "@/components/OutOfAvailabilityAlertDialog";
import { SelectItem } from "@/components/ui/select";
import {
  createAppointment,
  getAvailableSlotsForDoctor,
  updateAppointment,
} from "@/lib/actions/appointment.actions";
import { isWithinAvailability } from "@/lib/scheduling/getAvailableSlots";
import { getAppointmentSchema } from "@/lib/validation";
import { Appointment } from "@/types/appwrite.types";

import "react-datepicker/dist/react-datepicker.css";

import CustomFormField, { FormFieldType } from "../CustomFormField";
import { Button } from "../ui/button";
import { Form } from "../ui/form";

interface DoctorAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface DoctorOption {
  name: string;
  image?: string;
  availability?: DoctorAvailability[];
}

// TASK-041: the estimated treatment picked at booking time — its current
// estimatedDurationMinutes (TASK-040) is what createAppointment snapshots
// as the appointment's durationMinutes for the overlap check.
interface TreatmentOption {
  id: string;
  name: string;
  estimatedDurationMinutes: number;
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
  treatments = [],
}: {
  // Optional since TASK-023/024: staff-created patients have no linked
  // User — only used to resolve a phone number for the SMS confirmation.
  userId?: string;
  patientId: string;
  // TASK-056: "schedule" (reschedule) moved to the unified "Nuevo turno"
  // view — this form now only ever creates or cancels.
  type: "create" | "cancel";
  appointment?: Appointment;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  doctors: DoctorOption[];
  // Optional: only required for type="create" (TASK-041), where the
  // selector below is rendered. Rescheduling/cancelling an existing
  // appointment doesn't touch its already-snapshotted treatment.
  treatments?: TreatmentOption[];
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [availableTimes, setAvailableTimes] = useState<Date[] | null>(null);

  const AppointmentFormValidation = getAppointmentSchema(type);

  // TASK-042: client-side-only soft warning — see the Observaciones note in
  // docs/PLANNING.md (TASK-042) for why this isn't also enforced server-side.
  const [pendingValues, setPendingValues] = useState<z.infer<
    typeof AppointmentFormValidation
  > | null>(null);

  const form = useForm<z.infer<typeof AppointmentFormValidation>>({
    resolver: zodResolver(AppointmentFormValidation),
    defaultValues: {
      primaryPhysician: appointment ? appointment?.primaryPhysician : "",
      treatmentId: "",
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

  const submitAppointment = async (
    values: z.infer<typeof AppointmentFormValidation>
  ) => {
    setIsLoading(true);
    setSubmitError(null);

    const status = type === "cancel" ? "cancelled" : "pending";

    try {
      if (type === "create" && patientId) {
        const appointment = {
          userId,
          patient: patientId,
          primaryPhysician: values.primaryPhysician,
          treatmentId: values.treatmentId!,
          schedule: new Date(values.schedule),
          reason: values.reason!,
          status: status as Status,
          note: values.note,
        };

        const newAppointment = await createAppointment(appointment);

        if (newAppointment) {
          form.reset();
          // TASK-023/024: type="create" is only reached from staff flows now
          // (AdminNewAppointmentModal) — there's no more public patient
          // success page to redirect to. Close the dialog (same as the
          // cancel path below) and refresh so the caller's list picks up
          // the new appointment.
          setOpen?.(false);
          router.refresh();
        } else {
          setSubmitError(
            "No se pudo guardar el turno. Es posible que el horario ya no esté disponible — elegí otro e intentá de nuevo."
          );
        }
      } else {
        // type === "cancel" — the only remaining non-"create" case since
        // TASK-056 moved rescheduling to the unified "Nuevo turno" view.
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
          // Bug: this branch never refreshed the caller's list after a
          // successful cancellation, unlike the "create" branch above —
          // the cancelled status never showed up in /admin's table until a
          // manual full reload.
          router.refresh();
        }
      }
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  };

  // TASK-042: soft warning gate for the create flow only — reschedule/cancel
  // go straight to submitAppointment, unaffected. If the chosen date/time
  // falls outside the selected doctor's configured availability, hold the
  // values and ask for confirmation instead of submitting immediately; the
  // happy path (within availability) submits directly, with no extra step.
  const onSubmit = async (
    values: z.infer<typeof AppointmentFormValidation>
  ) => {
    if (type === "create") {
      const withinAvailability = isWithinAvailability(
        new Date(values.schedule),
        selectedDoctor?.availability ?? [],
      );

      if (!withinAvailability) {
        setPendingValues(values);
        return;
      }
    }

    await submitAppointment(values);
  };

  const confirmOutOfAvailability = async () => {
    if (!pendingValues) return;
    const values = pendingValues;
    setPendingValues(null);
    await submitAppointment(values);
  };

  const buttonLabel = type === "cancel" ? "Cancelar turno" : "Solicitar turno";

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
                    <DoctorAvatar name={doctor.name} image={doctor.image} size={32} />
                    <p>{doctor.name}</p>
                  </div>
                </SelectItem>
              ))}
            </CustomFormField>

            {type === "create" && (
              <CustomFormField
                fieldType={FormFieldType.SELECT}
                control={form.control}
                name="treatmentId"
                label="Prestación"
                placeholder="Seleccioná la prestación estimada"
              >
                {treatments.map((treatment) => (
                  <SelectItem key={treatment.id} value={treatment.id}>
                    {treatment.name} ({treatment.estimatedDurationMinutes} min)
                  </SelectItem>
                ))}
              </CustomFormField>
            )}

            <CustomFormField
              fieldType={FormFieldType.DATE_PICKER}
              control={form.control}
              name="schedule"
              label="Fecha estimada del turno"
              showTimeSelect
              dateFormat="dd/MM/yyyy  -  h:mm aa"
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
              />

              <CustomFormField
                fieldType={FormFieldType.TEXTAREA}
                control={form.control}
                name="note"
                label="Comentarios/notas"
                placeholder="Preferentemente por la tarde, si es posible"
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

        <Button
          type="submit"
          isLoading={isLoading}
          className={`${type === "cancel" ? "shad-danger-btn" : "shad-primary-btn"} w-full`}
        >
          {buttonLabel}
        </Button>
      </form>

      <OutOfAvailabilityAlertDialog
        open={pendingValues !== null}
        onCancel={() => setPendingValues(null)}
        onConfirm={confirmOutOfAvailability}
      />
    </Form>
  );
};
