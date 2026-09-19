"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { updateAppointment } from "@/lib/actions/appointment.actions";
import { Appointment } from "@/types/appwrite.types";

// TASK-067: TASK-056 removed the old "Confirmar turno" dialog, assuming
// rescheduling would be the only way to move a "pending" appointment to
// "scheduled" — DoctorWeekCalendar's reschedule flow hardcoded
// status: "scheduled" as a side effect of picking a new date. That left no
// way to confirm a turno without also changing it, and silently confirmed
// any reschedule regardless of its previous status. This button keeps the
// doctor/schedule untouched and only flips the status, using
// type: "schedule" so buildAppointmentSmsMessage sends the same "confirmed"
// wording it already sends after a reschedule.
export const ConfirmAppointmentButton = ({
  appointment,
}: {
  appointment: Appointment;
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    await updateAppointment({
      userId: appointment.userId,
      appointmentId: appointment.$id,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      appointment: {
        primaryPhysician: appointment.primaryPhysician,
        schedule: appointment.schedule,
        status: "scheduled",
      },
      type: "schedule",
    });
    setIsLoading(false);
    router.refresh();
  };

  return (
    <Button
      variant="ghost"
      className="text-green-500"
      isLoading={isLoading}
      onClick={handleConfirm}
    >
      Confirmar
    </Button>
  );
};
