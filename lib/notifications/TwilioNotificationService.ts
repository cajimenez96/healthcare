import twilio from "twilio";
import type { INotificationService } from "../repositories/INotificationService";

export class TwilioNotificationService implements INotificationService {
  async sendSms(to: string, message: string): Promise<void> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid) {
      throw new Error("TWILIO_ACCOUNT_SID environment variable is not defined");
    }
    if (!authToken) {
      throw new Error("TWILIO_AUTH_TOKEN environment variable is not defined");
    }
    if (!fromNumber) {
      throw new Error("TWILIO_PHONE_NUMBER environment variable is not defined");
    }

    const client = twilio(accountSid, authToken);

    // NOTE: intentionally not covered by an automated test. Calling the real
    // Twilio API costs money, is flaky under CI, and depends on external
    // network state; deep-mocking the Twilio SDK's internals would only test
    // the mock rather than real behavior (a testing anti-pattern). This is
    // the same manual-verification exception this project already applies to
    // scripts/check-db-connection.ts. The message content itself is fully
    // covered by lib/notifications/buildAppointmentSmsMessage.test.ts.
    await client.messages.create({
      body: message,
      from: fromNumber,
      to,
    });
  }
}
