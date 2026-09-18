"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { formatDateTime } from "@/lib/utils";
import { Appointment } from "@/types/appwrite.types";

import { AppointmentModal } from "../AppointmentModal";
import { DoctorAvatar } from "../DoctorAvatar";
import { StatusBadge } from "../StatusBadge";
import { Button } from "../ui/button";

type DoctorOption = { name: string; image?: string };

export const getColumns = (
  allDoctors: DoctorOption[],
  activeDoctors: DoctorOption[],
): ColumnDef<Appointment>[] => [
  {
    header: "#",
    cell: ({ row }) => {
      return <p className="text-14-medium ">{row.index + 1}</p>;
    },
  },
  {
    accessorKey: "patient",
    header: "Paciente",
    cell: ({ row }) => {
      const appointment = row.original;
      return <p className="text-14-medium ">{appointment.patient.name}</p>;
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const appointment = row.original;
      return (
        <div className="min-w-[115px]">
          <StatusBadge status={appointment.status} />
        </div>
      );
    },
  },
  {
    accessorKey: "schedule",
    header: "Turno",
    cell: ({ row }) => {
      const appointment = row.original;
      return (
        <p className="text-14-regular min-w-[100px]">
          {formatDateTime(appointment.schedule).dateTime}
        </p>
      );
    },
  },
  {
    accessorKey: "primaryPhysician",
    header: "Doctor",
    cell: ({ row }) => {
      const appointment = row.original;

      const doctor = allDoctors.find(
        (doctor) => doctor.name === appointment.primaryPhysician
      );
      const doctorName = doctor?.name ?? appointment.primaryPhysician;

      return (
        <div className="flex items-center gap-3">
          <DoctorAvatar name={doctorName} image={doctor?.image} size={32} />
          <p className="whitespace-nowrap">Dr. {doctorName}</p>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="pl-4">Acciones</div>,
    // TASK-056: "Confirmar turno" (the old AppointmentModal type="schedule"
    // dialog) is replaced by a link into the unified "Nuevo turno" view in
    // reschedule mode — it pre-fills this appointment's
    // patient/doctor/prestación and lets the calendar pick a new date.
    // "Cancelar" stays exactly the same AppointmentModal type="cancel"
    // dialog, unchanged. Both are now gated by status: a `completed`
    // appointment (already attended/billed) gets no actions at all, a
    // `cancelled` one can only be reagendado (nothing to cancel again), and
    // `pending`/`scheduled` get both.
    cell: ({ row }) => {
      const appointment = row.original;

      if (appointment.status === "completed") {
        return null;
      }

      return (
        <div className="flex gap-1">
          <Button asChild variant="ghost" className="text-green-500">
            <Link href={`/admin/turnos/nuevo?appointmentId=${appointment.$id}`}>
              Reagendar
            </Link>
          </Button>
          {appointment.status !== "cancelled" && (
            <AppointmentModal
              patientId={appointment.patient.$id}
              userId={appointment.userId}
              appointment={appointment}
              type="cancel"
              title="Cancelar turno"
              description="¿Estás seguro de que querés cancelar el turno?"
              doctors={activeDoctors}
            />
          )}
        </div>
      );
    },
  },
];
