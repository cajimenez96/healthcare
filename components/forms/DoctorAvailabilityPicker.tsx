"use client";

import type { z } from "zod";
import type { DoctorAvailabilityValidation } from "@/lib/validation";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

type Availability = z.infer<typeof DoctorAvailabilityValidation>;

const DAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

const DEFAULT_START = "09:00";
const DEFAULT_END = "18:00";

interface DoctorAvailabilityPickerProps {
  value: Availability[];
  onChange: (value: Availability[]) => void;
}

export const DoctorAvailabilityPicker = ({
  value,
  onChange,
}: DoctorAvailabilityPickerProps) => {
  const selectedDays = new Set(value.map((entry) => entry.dayOfWeek));
  const startTime = value[0]?.startTime ?? DEFAULT_START;
  const endTime = value[0]?.endTime ?? DEFAULT_END;

  const rebuild = (days: Set<number>, start: string, end: string) => {
    onChange(
      DAYS.filter((day) => days.has(day.value)).map((day) => ({
        dayOfWeek: day.value,
        startTime: start,
        endTime: end,
      })),
    );
  };

  const toggleDay = (day: number, checked: boolean) => {
    const next = new Set(selectedDays);
    checked ? next.add(day) : next.delete(day);
    rebuild(next, startTime, endTime);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {DAYS.map((day) => (
          <label key={day.value} className="flex items-center gap-2">
            <Checkbox
              checked={selectedDays.has(day.value)}
              onCheckedChange={(checked) => toggleDay(day.value, Boolean(checked))}
            />
            <span className="text-14-regular">{day.label}</span>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <Input
          type="time"
          value={startTime}
          onChange={(e) => rebuild(selectedDays, e.target.value, endTime)}
          className="shad-input w-fit"
        />
        <span className="text-14-regular">a</span>
        <Input
          type="time"
          value={endTime}
          onChange={(e) => rebuild(selectedDays, startTime, e.target.value)}
          className="shad-input w-fit"
        />
      </div>
    </div>
  );
};
