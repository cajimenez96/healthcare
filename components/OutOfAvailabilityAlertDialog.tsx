"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// TASK-042 built this warning+confirm flow inline inside AppointmentForm.
// TASK-043 needs the exact same flow from a second call site (the calendar's
// out-of-availability slot click) — extracted here rather than duplicated,
// since it's now used from two places (not more, so no bigger abstraction
// than this thin shared dialog is warranted).
export const OutOfAvailabilityAlertDialog = ({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) => (
  <AlertDialog
    open={open}
    onOpenChange={(next) => {
      if (!next) onCancel();
    }}
  >
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Horario fuera de disponibilidad</AlertDialogTitle>
        <AlertDialogDescription>
          <span className="block">
            Este horario no corresponde a la disponibilidad configurada del
            doctor.
          </span>
          <span className="mt-2 block">¿Desea asignar el turno igualmente?</span>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>
          Asignar igualmente
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
