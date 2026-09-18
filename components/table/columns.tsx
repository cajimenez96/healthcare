"use client";

import { ColumnDef } from "@tanstack/react-table";

import { formatDateTime } from "@/lib/utils";
import { Appointment } from "@/types/appwrite.types";

import { AppointmentModal } from "../AppointmentModal";
import { DoctorAvatar } from "../DoctorAvatar";
import { StatusBadge } from "../StatusBadge";

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
    cell: ({ row }) => {
      const appointment = row.original;

      return (
        <div className="flex gap-1">
          <AppointmentModal
            patientId={appointment.patient.$id}
            userId={appointment.userId}
            appointment={appointment}
            type="schedule"
            title="Confirmar turno"
            description="Confirmá los siguientes datos para agendar el turno."
            doctors={activeDoctors}
          />
          <AppointmentModal
            patientId={appointment.patient.$id}
            userId={appointment.userId}
            appointment={appointment}
            type="cancel"
            title="Cancelar turno"
            description="¿Estás seguro de que querés cancelar el turno?"
            doctors={activeDoctors}
          />
        </div>
      );
    },
  },
];
