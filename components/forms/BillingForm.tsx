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
import { Button } from "../ui/button";

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
  hasChartedTreatments: boolean;
}

interface BillingFormProps {
  appointment: BillableAppointment;
  activeTreatments: { id: string; name: string; price: number }[];
}

const BillingForm = ({ appointment, activeTreatments }: BillingFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTreatmentIds, setSelectedTreatmentIds] = useState<string[]>([]);

  const form = useForm<z.infer<typeof PaymentFormValidation>>({
    resolver: zodResolver(PaymentFormValidation),
    defaultValues: { paymentMethod: "cash" },
  });

  const toggleTreatment = (treatmentId: string) => {
    setSelectedTreatmentIds((current) =>
      current.includes(treatmentId)
        ? current.filter((id) => id !== treatmentId)
        : [...current, treatmentId],
    );
  };

  const manualTotal = activeTreatments
    .filter((t) => selectedTreatmentIds.includes(t.id))
    .reduce((sum, t) => sum + t.price, 0);

  const onSubmit = async (values: z.infer<typeof PaymentFormValidation>) => {
    setIsLoading(true);
    setError(null);

    const payment = await closeAppointmentBilling(
      appointment.appointmentId,
      values.paymentMethod,
      appointment.hasChartedTreatments ? undefined : selectedTreatmentIds,
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

      {appointment.hasChartedTreatments ? (
        <>
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
        </>
      ) : (
        <div className="space-y-2">
          <p className="text-14-regular text-dark-700">
            El doctor no cargó prestaciones para este turno — seleccioná las que corresponda cobrar:
          </p>
          <div className="space-y-2">
            {activeTreatments.map((treatment) => (
              <label
                key={treatment.id}
                className="flex cursor-pointer items-center gap-2 text-14-regular"
              >
                <input
                  type="checkbox"
                  checked={selectedTreatmentIds.includes(treatment.id)}
                  onChange={() => toggleTreatment(treatment.id)}
                />
                {treatment.name} — ${treatment.price.toLocaleString("es-AR")}
              </label>
            ))}
          </div>
          <p className="text-14-medium flex justify-between border-t border-dark-500 pt-2">
            <span>Total</span>
            <span>${manualTotal.toLocaleString("es-AR")}</span>
          </p>
        </div>
      )}

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

          <Button
            type="submit"
            className="shad-primary-btn w-full"
            isLoading={isLoading}
            disabled={!appointment.hasChartedTreatments && selectedTreatmentIds.length === 0}
          >
            Cobrar y cerrar turno
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default BillingForm;
