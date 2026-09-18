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
import { Button } from "@/components/ui/button";
import {
  createAppointment,
  getDoctorAppointmentsInRange,
  updateAppointment,
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
// their configured availability (TASK-006/042).
//
// TASK-052: an empty-slot click no longer books immediately — it only
// *selects* that slot (highlighted via slotPropGetter, same mechanism
// already used for availability coloring). Booking now happens from the
// explicit "Guardar turno" button below the calendar, which runs the exact
// same within-availability-direct / outside-availability-warning logic that
// used to run on click: within availability books directly, outside it
// opens OutOfAvailabilityAlertDialog first (TASK-042's warning+confirm flow,
// reused unchanged via OutOfAvailabilityAlertDialog — only the trigger
// moment moved from slot click to button click). Clicking an occupied event
// still shows a brief notice instead of selecting/booking anything; the real
// invariant is still createAppointment's server-side existsOverlapping hard
// block (TASK-041) regardless.
//
// TASK-056: also doubles as the reschedule calendar for the unified "Nuevo
// turno" view — when `appointmentId` is passed, confirming a slot calls
// updateAppointment on that existing appointment (status "scheduled")
// instead of createAppointment. Same isWithinAvailability warning and
// server-side existsOverlapping block apply unchanged either way;
// existsOverlapping already excludes the appointment being rescheduled from
// itself (TASK-007/041), and the busy events list here filters it out too so
// its own old slot doesn't render as an occupied conflict.
export const DoctorWeekCalendar = ({
  doctorName,
  availability,
  patientId,
  userId,
  treatmentId,
  treatmentName,
  // TASK-053: fired after a successful create/reschedule, once the success
  // message below is already set. NewAppointmentView (the only current
  // caller) uses this to redirect back to /admin — kept as a callback rather
  // than a redirect inside this component, since this calendar has no
  // business knowing which route hosts it.
  onBooked,
  // TASK-056: when set, this is reschedule mode — confirming a slot calls
  // updateAppointment on this existing appointment instead of
  // createAppointment. Also used to filter this appointment's own current
  // slot out of the busy-events list below, so rescheduling doesn't show it
  // to itself as an occupied conflict (existsOverlapping already excludes it
  // server-side, TASK-041/updateAppointment — this is purely the client-side
  // rendering counterpart of that same exclusion).
  appointmentId,
}: {
  doctorName: string;
  availability: DoctorAvailabilityEntry[];
  patientId: string;
  userId?: string;
  treatmentId: string;
  treatmentName: string;
  onBooked?: () => void;
  appointmentId?: string;
}) => {
  const [date, setDate] = useState(() => new Date());
  const [range, setRange] = useState(() => {
    const now = new Date();
    return {
      start: startOfWeek(now, { locale: es }),
      end: endOfWeek(now, { locale: es }),
    };
  });
  const [appointments, setAppointments] = useState<BusyAppointment[]>([]);
  // TASK-052: the slot a click has selected but not yet confirmed. Distinct
  // from `pendingSlot` below, which is specifically the slot awaiting the
  // out-of-availability warning's confirm/cancel — a selected slot only
  // becomes a pending one once "Guardar turno" is clicked and it turns out
  // to be outside availability.
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
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
      appointments
        .filter((appointment) => appointment.$id !== appointmentId)
        .map((appointment) => {
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
    [appointments, appointmentId],
  );

  const book = async (schedule: Date) => {
    setIsBooking(true);
    setMessage(null);

    // TASK-056: reschedule mode (appointmentId set, from the unified "Nuevo
    // turno" view's ?appointmentId= query param) updates the existing
    // appointment instead of creating a new one — status "scheduled", same
    // as the old AppointmentForm "schedule" case this replaces. Otherwise,
    // same create-mode defaults as before: status "pending" (a
    // secretary/admin reschedules it into "scheduled" afterward via this
    // same view). Neither mode has a free-text "Motivo del turno" field of
    // its own (a click-to-book/reschedule slot, not a form) — the estimated
    // treatment's name is a reasonable stand-in reason.
    const result = appointmentId
      ? await updateAppointment({
          userId,
          appointmentId,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          appointment: {
            primaryPhysician: doctorName,
            treatmentId,
            schedule,
            status: "scheduled",
          },
          type: "schedule",
        })
      : await createAppointment({
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
    // TASK-052: whether the booking attempt succeeded or failed, the
    // confirm step is over — clear the selection so the highlight and
    // "Guardar turno" bar disappear rather than lingering on a slot that's
    // either now booked or was rejected server-side.
    setSelectedSlot(null);
    await loadAppointments();

    if (result) {
      setMessage({
        type: "success",
        text: appointmentId
          ? "Turno reagendado con éxito."
          : "Turno agendado con éxito.",
      });
      onBooked?.();
    } else {
      setMessage({
        type: "error",
        text: "No se pudo guardar el turno. Es posible que el horario ya no esté disponible — elegí otro e intentá de nuevo.",
      });
    }
  };

  // TASK-052: an empty-slot click only selects it now — clicking the
  // already-selected slot again clears the selection (a discoverable toggle,
  // backed up by the explicit "Cancelar selección" button below for anyone
  // who wouldn't find the toggle on their own), and clicking a different
  // empty slot just moves the selection rather than booking the old one.
  const handleSelectSlot = (slotInfo: SlotInfo) => {
    if (isBooking) return;
    setMessage(null);
    setSelectedSlot((current) =>
      current && current.getTime() === slotInfo.start.getTime()
        ? null
        : slotInfo.start,
    );
  };

  // TASK-052: this is the exact logic that used to run directly from
  // handleSelectSlot on click — moved verbatim to fire from the "Guardar
  // turno" button instead. Within availability books immediately; outside
  // it, same as before, opens OutOfAvailabilityAlertDialog and only books
  // once that's confirmed (confirmOutOfAvailability below).
  const confirmBooking = () => {
    if (!selectedSlot || isBooking) return;
    setMessage(null);

    if (isWithinAvailability(selectedSlot, availability)) {
      book(selectedSlot);
    } else {
      setPendingSlot(selectedSlot);
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

      {/* TASK-052: the selection step between clicking a slot and actually
          booking it — stays visible for as long as a slot is selected, and
          disappears once it's confirmed, cancelled, or another slot is
          picked instead. */}
      {selectedSlot && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-dark-500 bg-dark-400 px-4 py-3">
          <p className="text-14-medium">
            Horario seleccionado:{" "}
            <span className="text-green-500">
              {format(selectedSlot, "EEEE d 'de' MMMM, HH:mm 'hs'", {
                locale: es,
              })}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="shad-gray-btn"
              disabled={isBooking}
              onClick={() => setSelectedSlot(null)}
            >
              Cancelar selección
            </Button>
            <Button
              type="button"
              className="shad-primary-btn"
              onClick={confirmBooking}
              isLoading={isBooking}
              loadingText="Guardando..."
            >
              Guardar turno
            </Button>
          </div>
        </div>
      )}

      <div className="rbc-dark-theme rounded-md border border-dark-500 bg-dark-400 p-2">
        <Calendar
          localizer={localizer}
          culture="es"
          events={events}
          view={Views.WEEK}
          onView={() => {}}
          views={[Views.WEEK]}
          date={date}
          onNavigate={setDate}
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
          slotPropGetter={(date: Date) => {
            const availabilityClass = isWithinAvailability(date, availability)
              ? "rbc-slot-available"
              : "rbc-slot-unavailable";
            const isSelected =
              selectedSlot !== null &&
              date.getTime() === selectedSlot.getTime();
            return {
              className: isSelected
                ? `${availabilityClass} rbc-slot-selected`
                : availabilityClass,
            };
          }}
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
