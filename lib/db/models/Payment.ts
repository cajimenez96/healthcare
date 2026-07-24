import { Schema, model, models, Types } from "mongoose";

export type PaymentMethod = "cash" | "transfer" | "card";

export interface IPaymentItem {
  name: string;
  price: number;
}

export interface IPayment {
  _id: Types.ObjectId;
  appointmentId: Types.ObjectId;
  patientId: Types.ObjectId;
  patientName: string;
  doctorName: string;
  items: IPaymentItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  registeredBy: string;
  paidAt: Date;
}

const paymentItemSchema = new Schema<IPaymentItem>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false },
);

const paymentSchema = new Schema<IPayment>({
  appointmentId: {
    type: Schema.Types.ObjectId,
    ref: "Appointment",
    required: true,
    unique: true,
    index: true,
  },
  patientId: {
    type: Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
    index: true,
  },
  patientName: { type: String, required: true },
  doctorName: { type: String, required: true },
  items: { type: [paymentItemSchema], required: true },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ["cash", "transfer", "card"], required: true },
  registeredBy: { type: String, required: true },
  paidAt: { type: Date, required: true, default: Date.now },
});

export const Payment = models.Payment || model<IPayment>("Payment", paymentSchema);
