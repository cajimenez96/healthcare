import { describe, it, expect } from "vitest";

import { buildAppointmentSmsMessage } from "./buildAppointmentSmsMessage";

describe("buildAppointmentSmsMessage", () => {
  it("builds the confirmation message for a 'schedule' update", () => {
    const message = buildAppointmentSmsMessage(
      "schedule",
      {
        schedule: new Date("2026-08-01T14:30:00Z"),
        primaryPhysician: "Dr. Cameron",
      },
      "UTC",
    );

    expect(message).toBe(
      "Greetings from CarePulse. Your appointment is confirmed for Aug 1, 2026, 2:30 PM with Dr. Dr. Cameron.",
    );
  });

  it("builds the cancellation message for a 'cancel' update, preserving the double space before the reason", () => {
    const message = buildAppointmentSmsMessage(
      "cancel",
      {
        schedule: new Date("2026-08-01T14:30:00Z"),
        primaryPhysician: "Dr. Cameron",
        cancellationReason: "Doctor unavailable",
      },
      "UTC",
    );

    expect(message).toBe(
      "Greetings from CarePulse. We regret to inform that your appointment for Aug 1, 2026, 2:30 PM is cancelled. Reason:  Doctor unavailable.",
    );
  });

  it("respects the provided IANA time zone when formatting the schedule", () => {
    const message = buildAppointmentSmsMessage(
      "schedule",
      {
        schedule: new Date("2026-08-01T14:30:00Z"),
        primaryPhysician: "Dr. House",
      },
      "America/Argentina/Buenos_Aires",
    );

    expect(message).toBe(
      "Greetings from CarePulse. Your appointment is confirmed for Aug 1, 2026, 11:30 AM with Dr. Dr. House.",
    );
  });
});
