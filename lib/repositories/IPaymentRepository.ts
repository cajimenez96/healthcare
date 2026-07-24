// Pure port — no framework or Mongo imports. Implementations live in lib/db/repositories.

export type PaymentMethod = "cash" | "transfer" | "card";

export interface PaymentItem {
  name: string;
  price: number;
}

export interface PaymentRecord {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  items: PaymentItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  registeredBy: string;
  paidAt: Date;
}

export type CreatePaymentInput = Omit<PaymentRecord, "id" | "paidAt">;

export interface IPaymentRepository {
  /** Throws if the appointment was already billed (one payment per appointment). */
  create(input: CreatePaymentInput): Promise<PaymentRecord>;
  findByAppointmentId(appointmentId: string): Promise<PaymentRecord | null>;
}
