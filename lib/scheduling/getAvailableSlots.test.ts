import { describe, it, expect } from "vitest";
import { getAvailableSlots } from "./getAvailableSlots";

// 2026-08-03 is a Monday (dayOfWeek = 1)
const MONDAY = new Date("2026-08-03T00:00:00");
const TUESDAY = new Date("2026-08-04T00:00:00");

describe("getAvailableSlots", () => {
  it("returns an empty array when the doctor doesn't work that day", () => {
    const availability = [{ dayOfWeek: 1, startTime: "09:00", endTime: "11:00" }];

    expect(getAvailableSlots(availability, TUESDAY, [])).toEqual([]);
  });

  it("returns 30-minute slots covering the full availability window", () => {
    const availability = [{ dayOfWeek: 1, startTime: "09:00", endTime: "11:00" }];

    expect(getAvailableSlots(availability, MONDAY, [])).toEqual([
      "09:00",
      "09:30",
      "10:00",
      "10:30",
    ]);
  });

  it("excludes already booked slots", () => {
    const availability = [{ dayOfWeek: 1, startTime: "09:00", endTime: "11:00" }];

    expect(getAvailableSlots(availability, MONDAY, ["09:30", "10:30"])).toEqual([
      "09:00",
      "10:00",
    ]);
  });

  it("returns an empty array when every slot is booked", () => {
    const availability = [{ dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }];

    expect(
      getAvailableSlots(availability, MONDAY, ["09:00", "09:30"]),
    ).toEqual([]);
  });

  it("supports a custom slot duration", () => {
    const availability = [{ dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }];

    expect(getAvailableSlots(availability, MONDAY, [], 20)).toEqual([
      "09:00",
      "09:20",
      "09:40",
    ]);
  });

  it("combines multiple availability windows on the same day", () => {
    const availability = [
      { dayOfWeek: 1, startTime: "09:00", endTime: "10:00" },
      { dayOfWeek: 1, startTime: "14:00", endTime: "15:00" },
    ];

    expect(getAvailableSlots(availability, MONDAY, [])).toEqual([
      "09:00",
      "09:30",
      "14:00",
      "14:30",
    ]);
  });
});
