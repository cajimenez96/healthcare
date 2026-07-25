"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form } from "@/components/ui/form";
import { SelectItem } from "@/components/ui/select";
import { closeAppointmentBilling } from "@/lib/actions/payment.actions";
import { formatDateTime } from "@/lib/utils";
import { PaymentFormValidation } from "@/lib/validation";

import CustomFormField, { FormFieldType } from "../CustomFormField";
import SubmitButton from "../SubmitButton";

const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Efectivo" },
  { value: "transfer", label: "Transferencia" },
  { value: "card", label: "Tarjeta" },
];

interface BillableAppointment {
  appointmentId: string;
  patientName: string;
  doctorName: string;
  schedule: string;
  items: { name: string; price: number }[];
  totalAmount: number;
}

const BillingForm = ({ appointment }: { appointment: BillableAppointment }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof PaymentFormValidation>>({
    resolver: zodResolver(PaymentFormValidation),
    defaultValues: { paymentMethod: "cash" },
  });

  const onSubmit = async (values: z.infer<typeof PaymentFormValidation>) => {
    setIsLoading(true);
    setError(null);

    const payment = await closeAppointmentBilling(
      appointment.appointmentId,
      values.paymentMethod,
    );

    setIsLoading(false);

    if (payment) {
      router.push(`/recepcion/recibo/${appointment.appointmentId}`);
    } else {
      setError("No se pudo registrar el cobro. Intentá de nuevo.");
    }
  };

  return (
    <div className="space-y-4 rounded-md border border-dark-500 p-4">
      <div>
        <p className="text-14-medium">{appointment.patientName}</p>
        <p className="text-12-regular text-dark-700">
          {appointment.doctorName} · {formatDateTime(appointment.schedule).dateTime}
        </p>
      </div>

      <ul className="text-14-regular space-y-1">
        {appointment.items.map((item, i) => (
          <li key={i} className="flex justify-between">
            <span>{item.name}</span>
            <span>${item.price.toLocaleString("es-AR")}</span>
          </li>
        ))}
      </ul>

      <p className="text-14-medium flex justify-between border-t border-dark-500 pt-2">
        <span>Total</span>
        <span>${appointment.totalAmount.toLocaleString("es-AR")}</span>
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CustomFormField
            fieldType={FormFieldType.SELECT}
            control={form.control}
            name="paymentMethod"
            label="Medio de pago"
            placeholder="Seleccioná un medio de pago"
          >
            {PAYMENT_METHOD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </CustomFormField>

          {error && <p className="shad-error text-14-regular">{error}</p>}

          <SubmitButton isLoading={isLoading}>Cobrar y cerrar turno</SubmitButton>
        </form>
      </Form>
    </div>
  );
};

export default BillingForm;
