import type { HydratedDocument } from "mongoose";
import type { IPayment } from "../models/Payment";
import { Payment } from "../models/Payment";
import type {
  CreatePaymentInput,
  IPaymentRepository,
  PaymentRecord,
} from "../../repositories/IPaymentRepository";

function toPaymentRecord(doc: HydratedDocument<IPayment>): PaymentRecord {
  return {
    id: doc._id.toString(),
    appointmentId: doc.appointmentId.toString(),
    patientId: doc.patientId.toString(),
    patientName: doc.patientName,
    doctorName: doc.doctorName,
    items: doc.items.map((item) => ({ name: item.name, price: item.price })),
    totalAmount: doc.totalAmount,
    paymentMethod: doc.paymentMethod,
    registeredBy: doc.registeredBy,
    paidAt: doc.paidAt,
  };
}

export class MongoPaymentRepository implements IPaymentRepository {
  async create(input: CreatePaymentInput): Promise<PaymentRecord> {
    const doc = await Payment.create(input);
    return toPaymentRecord(doc);
  }

  async findByAppointmentId(appointmentId: string): Promise<PaymentRecord | null> {
    const doc = await Payment.findOne({ appointmentId });
    return doc ? toPaymentRecord(doc) : null;
  }
}
