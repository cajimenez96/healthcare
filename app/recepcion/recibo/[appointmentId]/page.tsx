import Image from "next/image";
import { redirect } from "next/navigation";

import { PrintButton } from "@/components/PrintButton";
import { getPaymentByAppointment } from "@/lib/actions/payment.actions";
import { formatDateTime } from "@/lib/utils";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
};

const ReciboPage = async (
  props: {
    params: Promise<{ appointmentId: string }>;
  }
) => {
  const params = await props.params;

  const {
    appointmentId
  } = params;

  const payment = await getPaymentByAppointment(appointmentId);

  if (!payment) {
    redirect("/recepcion");
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col space-y-8 py-10">
      <div className="flex items-center justify-between print:hidden">
        <Image
          src="/assets/icons/logo-full.svg"
          height={32}
          width={162}
          alt="logo"
          className="h-8 w-fit"
        />
        <PrintButton />
      </div>

      <section className="space-y-6 rounded-md border border-dark-500 p-8">
        <div>
          <h1 className="header">Comprobante de Cobro</h1>
          <p className="text-14-regular text-dark-700">
            {formatDateTime(payment.paidAt).dateTime}
          </p>
        </div>

        <div className="text-14-regular grid grid-cols-2 gap-4">
          <p>
            <span className="text-dark-700">Paciente: </span>
            {payment.patientName}
          </p>
          <p>
            <span className="text-dark-700">Profesional: </span>
            {payment.doctorName}
          </p>
          <p>
            <span className="text-dark-700">Medio de pago: </span>
            {PAYMENT_METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod}
          </p>
          <p>
            <span className="text-dark-700">Registrado por: </span>
            {payment.registeredBy}
          </p>
        </div>

        <table className="text-14-regular w-full">
          <thead>
            <tr className="border-b border-dark-500 text-left text-dark-700">
              <th className="py-2">Prestación</th>
              <th className="py-2 text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {payment.items.map((item: { name: string; price: number }, i: number) => (
              <tr key={i} className="border-b border-dark-500">
                <td className="py-2">{item.name}</td>
                <td className="py-2 text-right">${item.price.toLocaleString("es-AR")}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="text-16-semibold flex justify-between">
          <span>Total abonado</span>
          <span>${payment.totalAmount.toLocaleString("es-AR")}</span>
        </p>
      </section>
    </div>
  );
};

export default ReciboPage;
