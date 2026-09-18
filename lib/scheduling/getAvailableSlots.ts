export interface DoctorAvailabilityEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function toTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const mins = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

export function getAvailableSlots(
  availability: DoctorAvailabilityEntry[],
  date: Date,
  bookedTimes: string[],
  slotMinutes = 30,
): string[] {
  const dayOfWeek = date.getDay();
  const bookedSet = new Set(bookedTimes);

  const slots: string[] = [];
  for (const entry of availability) {
    if (entry.dayOfWeek !== dayOfWeek) continue;

    const start = toMinutes(entry.startTime);
    const end = toMinutes(entry.endTime);

    for (let minutes = start; minutes + slotMinutes <= end; minutes += slotMinutes) {
      const slot = toTimeString(minutes);
      if (!bookedSet.has(slot)) {
        slots.push(slot);
      }
    }
  }

  return slots;
}

// TASK-042: answers "is this exact date/time inside the doctor's configured
// availability?" — reuses the same day/time-window math as getAvailableSlots
// above (toMinutes + per-entry dayOfWeek/start/end comparison) instead of
// duplicating it, but isn't tied to slot granularity: a manually-typed time
// that doesn't land on a 30-minute boundary can still be "within
// availability" as long as it falls inside a configured window.
export function isWithinAvailability(
  date: Date,
  availability: DoctorAvailabilityEntry[],
): boolean {
  const dayOfWeek = date.getDay();
  const minutes = date.getHours() * 60 + date.getMinutes();

  return availability.some((entry) => {
    if (entry.dayOfWeek !== dayOfWeek) return false;

    const start = toMinutes(entry.startTime);
    const end = toMinutes(entry.endTime);
    return minutes >= start && minutes < end;
  });
}
