"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Appointment } from "@/types/appwrite.types";

import { AppointmentForm } from "./forms/AppointmentForm";

import "react-datepicker/dist/react-datepicker.css";

// TASK-056: rescheduling ("schedule") moved to the unified "Nuevo turno"
// view (a Link to /admin/turnos/nuevo?appointmentId=, wired directly in
// columns.tsx) — this modal now only ever handles cancellation.
export const AppointmentModal = ({
  patientId,
  userId,
  appointment,
  type,
  title,
  description,
  doctors,
}: {
  patientId: string;
  // Optional since TASK-023/024: staff-created patients have no linked User.
  userId?: string;
  appointment?: Appointment;
  type: "cancel";
  title: string;
  description: string;
  doctors: {
    name: string;
    image?: string;
    availability?: { dayOfWeek: number; startTime: string; endTime: string }[];
  }[];
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost">Cancelar</Button>
      </DialogTrigger>
      <DialogContent className="shad-dialog sm:max-w-md">
        <DialogHeader className="mb-4 space-y-3">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <AppointmentForm
          userId={userId}
          patientId={patientId}
          type={type}
          appointment={appointment}
          setOpen={setOpen}
          doctors={doctors}
        />
      </DialogContent>
    </Dialog>
  );
};
