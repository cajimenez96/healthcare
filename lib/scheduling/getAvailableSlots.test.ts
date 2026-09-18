import { describe, it, expect } from "vitest";

import { getAvailableSlots, isWithinAvailability } from "./getAvailableSlots";

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

// TASK-042: shares the day/time-window logic with getAvailableSlots above,
// but answers a different question — "is this exact date/time inside the
// doctor's configured availability?" — used to warn (not block) when a
// secretary books outside it.
describe("isWithinAvailability", () => {
  it("returns false when the doctor doesn't work that day", () => {
    const availability = [{ dayOfWeek: 1, startTime: "09:00", endTime: "11:00" }];

    expect(isWithinAvailability(new Date(2026, 7, 4, 10, 0), availability)).toBe(
      false,
    );
  });

  it("returns true for a time inside the availability window", () => {
    const availability = [{ dayOfWeek: 1, startTime: "09:00", endTime: "11:00" }];

    expect(isWithinAvailability(new Date(2026, 7, 3, 10, 0), availability)).toBe(
      true,
    );
  });

  it("returns false for a time before the window starts", () => {
    const availability = [{ dayOfWeek: 1, startTime: "09:00", endTime: "11:00" }];

    expect(isWithinAvailability(new Date(2026, 7, 3, 8, 30), availability)).toBe(
      false,
    );
  });

  it("returns false for a time at or after the window ends", () => {
    const availability = [{ dayOfWeek: 1, startTime: "09:00", endTime: "11:00" }];

    expect(isWithinAvailability(new Date(2026, 7, 3, 11, 0), availability)).toBe(
      false,
    );
  });

  it("returns true for a time that isn't aligned to a 30-minute slot but is still inside the window", () => {
    const availability = [{ dayOfWeek: 1, startTime: "09:00", endTime: "11:00" }];

    expect(isWithinAvailability(new Date(2026, 7, 3, 10, 45), availability)).toBe(
      true,
    );
  });

  it("checks every window when the doctor has multiple availability entries the same day", () => {
    const availability = [
      { dayOfWeek: 1, startTime: "09:00", endTime: "10:00" },
      { dayOfWeek: 1, startTime: "14:00", endTime: "15:00" },
    ];

    expect(isWithinAvailability(new Date(2026, 7, 3, 14, 30), availability)).toBe(
      true,
    );
    expect(isWithinAvailability(new Date(2026, 7, 3, 12, 0), availability)).toBe(
      false,
    );
  });

  it("returns false when the doctor has no availability configured", () => {
    expect(isWithinAvailability(new Date(2026, 7, 3, 10, 0), [])).toBe(false);
  });
});
