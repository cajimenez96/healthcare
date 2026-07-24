export interface DoctorAvailabilityEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

function toMinutes(time: string): number {
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
