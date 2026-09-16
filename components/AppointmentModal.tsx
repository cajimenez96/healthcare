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

const TRIGGER_LABELS = {
  schedule: "Confirmar",
  cancel: "Cancelar",
};

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
  type: "schedule" | "cancel";
  title: string;
  description: string;
  doctors: {
    name: string;
    image: string;
    availability?: { dayOfWeek: number; startTime: string; endTime: string }[];
  }[];
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className={type === "schedule" ? "text-green-500" : undefined}
        >
          {TRIGGER_LABELS[type]}
        </Button>
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
