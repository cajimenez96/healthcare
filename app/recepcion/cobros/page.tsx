import BillingForm from "@/components/forms/BillingForm";
import { getBillableAppointments } from "@/lib/actions/payment.actions";
import { getActiveTreatments } from "@/lib/actions/treatment.actions";

// TASK-071: moved from /recepcion (previously the home page) to its own
// route — "Turnos de hoy" is now what Secretaria sees first, and billing
// gets its own dedicated screen/nav item instead of being the landing view.
const CobrosPage = async () => {
  const [billableAppointments, activeTreatments] = await Promise.all([
    getBillableAppointments(),
    getActiveTreatments(),
  ]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-14">
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
                hasChartedTreatments: boolean;
              }) => (
                <BillingForm
                  key={appointment.appointmentId}
                  appointment={appointment}
                  activeTreatments={activeTreatments}
                />
              )
            )}
            {billableAppointments.length === 0 && (
              <p className="text-dark-700">
                No hay turnos pendientes de cobro.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default CobrosPage;
