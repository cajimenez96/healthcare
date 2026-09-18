"use client";

import { endOfWeek, format, getDay, parse, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  Views,
  type SlotInfo,
} from "react-big-calendar";

import { OutOfAvailabilityAlertDialog } from "@/components/OutOfAvailabilityAlertDialog";
import {
  createAppointment,
  getDoctorAppointmentsInRange,
} from "@/lib/actions/appointment.actions";
import { isWithinAvailability } from "@/lib/scheduling/getAvailableSlots";

import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { es };

// date-fns localizer (TASK-043's ticket explicitly rules out moment, which
// this project has no other reason to depend on).
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// A reasonable fixed business window (07:00-21:00) rather than a full
// 24h grid — only the hour/minute portion of these two Dates is read by
// react-big-calendar.
const MIN_TIME = new Date(1970, 0, 1, 7, 0, 0);
const MAX_TIME = new Date(1970, 0, 1, 21, 0, 0);

interface DoctorAvailabilityEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface BusyAppointment {
  $id: string;
  schedule: string | Date;
  durationMinutes: number;
  patient: { name: string };
}

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  resource: { appointmentId: string };
}

// TASK-043: the calendar half of the new "Nuevo turno" screen — scoped to a
// single already-selected doctor/patient/treatment (NewAppointmentView only
// mounts this once all three are picked). Renders that doctor's busy
// appointments for the visible week, distinguishes hours inside/outside
// their configured availability (TASK-006/042), and books directly on an
// empty-slot click (within availability) or after the same
// warning+confirm flow AppointmentForm already uses (outside availability,
// TASK-042) — reused via OutOfAvailabilityAlertDialog rather than
// reimplemented. Clicking an occupied event shows a brief notice instead of
// attempting to book; the real invariant is still createAppointment's
// server-side existsOverlapping hard block (TASK-041) regardless.
export const DoctorWeekCalendar = ({
  doctorName,
  availability,
  patientId,
  userId,
  treatmentId,
  treatmentName,
  onBooked,
}: {
  doctorName: string;
  availability: DoctorAvailabilityEntry[];
  patientId: string;
  userId?: string;
  treatmentId: string;
  treatmentName: string;
  onBooked?: () => void;
}) => {
  const [range, setRange] = useState(() => {
    const now = new Date();
    return {
      start: startOfWeek(now, { locale: es }),
      end: endOfWeek(now, { locale: es }),
    };
  });
  const [appointments, setAppointments] = useState<BusyAppointment[]>([]);
  const [pendingSlot, setPendingSlot] = useState<Date | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [message, setMessage] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);
  const [occupiedNotice, setOccupiedNotice] = useState(false);

  const loadAppointments = useCallback(async () => {
    const result = await getDoctorAppointmentsInRange(
      doctorName,
      range.start,
      range.end,
    );
    setAppointments(result ?? []);
  }, [doctorName, range.start, range.end]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    if (!occupiedNotice) return;
    const timeout = setTimeout(() => setOccupiedNotice(false), 3000);
    return () => clearTimeout(timeout);
  }, [occupiedNotice]);

  const events: CalendarEvent[] = useMemo(
    () =>
      appointments.map((appointment) => {
        const start = new Date(appointment.schedule);
        const end = new Date(
          start.getTime() + appointment.durationMinutes * 60_000,
        );
        const hours = start.getHours().toString().padStart(2, "0");
        const minutes = start.getMinutes().toString().padStart(2, "0");
        return {
          title: `${appointment.patient.name} · ${hours}:${minutes}`,
          start,
          end,
          resource: { appointmentId: appointment.$id },
        };
      }),
    [appointments],
  );

  const book = async (schedule: Date) => {
    setIsBooking(true);
    setMessage(null);

    // Same defaults AdminNewAppointmentModal/AppointmentForm used for a
    // direct staff-side booking: status "pending" (a secretary/admin
    // confirms it afterward via the existing "Confirmar turno" flow,
    // unchanged by this ticket). This screen has no free-text "Motivo del
    // turno" field of its own (a click-to-book slot, not a form) — the
    // estimated treatment's name is a reasonable stand-in reason.
    const created = await createAppointment({
      userId,
      patient: patientId,
      primaryPhysician: doctorName,
      treatmentId,
      schedule,
      reason: treatmentName,
      status: "pending",
      note: undefined,
    });

    setIsBooking(false);
    await loadAppointments();

    if (created) {
      setMessage({ type: "success", text: "Turno agendado con éxito." });
      onBooked?.();
    } else {
      setMessage({
        type: "error",
        text: "No se pudo guardar el turno. Es posible que el horario ya no esté disponible — elegí otro e intentá de nuevo.",
      });
    }
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    if (isBooking) return;
    setMessage(null);

    if (isWithinAvailability(slotInfo.start, availability)) {
      book(slotInfo.start);
    } else {
      setPendingSlot(slotInfo.start);
    }
  };

  const confirmOutOfAvailability = () => {
    if (!pendingSlot) return;
    const schedule = pendingSlot;
    setPendingSlot(null);
    book(schedule);
  };

  return (
    <div className="space-y-3">
      {message && (
        <p
          className={
            message.type === "success"
              ? "text-14-medium text-green-500"
              : "shad-error text-14-regular"
          }
        >
          {message.text}
        </p>
      )}
      {occupiedNotice && (
        <p className="text-14-regular text-dark-700">
          Este horario ya está ocupado.
        </p>
      )}

      <div className="rbc-dark-theme rounded-md border border-dark-500 bg-dark-400 p-2">
        <Calendar
          localizer={localizer}
          culture="es"
          events={events}
          defaultView={Views.WEEK}
          views={[Views.WEEK]}
          defaultDate={range.start}
          onRangeChange={(newRange) => {
            if (Array.isArray(newRange)) return;
            setRange({ start: newRange.start, end: newRange.end });
          }}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={() => setOccupiedNotice(true)}
          step={30}
          timeslots={1}
          min={MIN_TIME}
          max={MAX_TIME}
          style={{ height: 600 }}
          slotPropGetter={(date: Date) => ({
            className: isWithinAvailability(date, availability)
              ? "rbc-slot-available"
              : "rbc-slot-unavailable",
          })}
          messages={{
            week: "Semana",
            day: "Día",
            today: "Hoy",
            previous: "Atrás",
            next: "Siguiente",
            date: "Fecha",
            time: "Hora",
            event: "Turno",
            noEventsInRange: "Sin turnos en este rango.",
            showMore: (count: number) => `+${count} más`,
          }}
        />
      </div>

      <OutOfAvailabilityAlertDialog
        open={pendingSlot !== null}
        onCancel={() => setPendingSlot(null)}
        onConfirm={confirmOutOfAvailability}
      />
    </div>
  );
};
