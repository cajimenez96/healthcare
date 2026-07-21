// Pure port — no framework or Mongo imports. Implementations live in lib/notifications.

export interface INotificationService {
  sendSms(to: string, message: string): Promise<void>;
}
