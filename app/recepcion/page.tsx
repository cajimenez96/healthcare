import Image from "next/image";

import BillingForm from "@/components/forms/BillingForm";
import { getBillableAppointments } from "@/lib/actions/payment.actions";

const RecepcionPage = async () => {
  const billableAppointments = await getBillableAppointments();

  return (
    <div className="mx-auto flex max-w-4xl flex-col space-y-14">
      <header className="admin-header">
        <Image
          src="/assets/icons/logo-full.svg"
          height={32}
          width={162}
          alt="logo"
          className="h-8 w-fit"
        />

        <p className="text-16-semibold">Recepción</p>
      </header>

      <main className="admin-main">
        <section className="w-full space-y-4">
          <h1 className="header">Turnos para cobrar</h1>
          <div className="space-y-4">
            {billableAppointments.map(
              (appointment: {
                appointmentId: string;
                patientName: string;
                doctorName: string;
                schedule: string;
                items: { name: string; price: number }[];
                totalAmount: number;
              }) => (
                <BillingForm key={appointment.appointmentId} appointment={appointment} />
              ),
            )}
            {billableAppointments.length === 0 && (
              <p className="text-dark-700">
                No hay turnos con prestaciones cargadas pendientes de cobro.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default RecepcionPage;
