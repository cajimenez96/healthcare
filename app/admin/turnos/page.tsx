import Link from "next/link";

import { NewAppointmentView } from "@/components/NewAppointmentView";
import { AppointmentsTable } from "@/components/table/AppointmentsTable";
import { Button } from "@/components/ui/button";
import {
  getAppointment,
  getRecentAppointmentList,
} from "@/lib/actions/appointment.actions";
import { getActiveDoctors, getAllDoctors } from "@/lib/actions/doctor.actions";
import { getActiveInsuranceProviders } from "@/lib/actions/insuranceProvider.actions";
import { getPatientForAppointment } from "@/lib/actions/patient.actions";
import { getActiveTreatments } from "@/lib/actions/treatment.actions";

// TASK-060: unifies what used to be split across /admin (listado + filtros,
// TASK-054) and /admin/turnos/nuevo (agendar/reagendar con calendario,
// TASK-043/049-052/056) into this single route/view, same spirit as
// TASK-059 did for patients. The toggle between "showing the filtered list"
// and "showing the booking/reschedule flow" is driven entirely by
// searchParams rather than component state: `?appointmentId=` (unchanged
// from TASK-056's reschedule pattern) or a new `?new=true` for a fresh
// booking. Neither present renders the list. This keeps the toggle
// server-driven/shareable (a "Nuevo turno" link, a "Reagendar" link, a
// "Volver al listado" link — no client state needed to flip between them)
// and lets this page stay a Server Component like /admin/pacientes
// (TASK-059) and the old /admin/turnos/nuevo did.
const TurnosPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const resolvedSearchParams = await searchParams;
  const appointmentId = (resolvedSearchParams?.appointmentId as string) || "";
  const isNew = resolvedSearchParams?.new === "true";
  const showBookingFlow = isNew || Boolean(appointmentId);

  if (showBookingFlow) {
    const [doctors, treatments, insuranceProviders] = await Promise.all([
      getActiveDoctors(),
      getActiveTreatments(),
      getActiveInsuranceProviders(),
    ]);

    let rescheduleError = false;
    let initialPatient;
    let initialDoctorName: string | undefined;
    let initialTreatmentId: string | undefined;
    let initialStatus: Status | undefined;

    if (appointmentId) {
      const appointment = await getAppointment(appointmentId);
      const patient = appointment
        ? await getPatientForAppointment(appointment.patientId)
        : undefined;

      if (appointment && patient) {
        initialPatient = patient;
        initialDoctorName = appointment.primaryPhysician;
        initialTreatmentId = appointment.treatmentId;
        initialStatus = appointment.status;
      } else {
        rescheduleError = true;
      }
    }

    return (
      <div className="mx-auto flex max-w-7xl flex-col space-y-14">
        <main className="admin-main">
          <Link
            href="/admin/turnos"
            className="text-14-medium text-green-500"
          >
            ← Volver al listado
          </Link>

          {rescheduleError ? (
            <section className="w-full max-w-4xl space-y-2">
              <h1 className="header">Turno no encontrado</h1>
              <p className="shad-error text-14-regular">
                No se pudo cargar el turno a reagendar. Puede que ya no
                exista.
              </p>
            </section>
          ) : (
            <NewAppointmentView
              doctors={doctors}
              treatments={treatments}
              insuranceProviders={insuranceProviders}
              appointmentId={appointmentId || undefined}
              initialPatient={initialPatient}
              initialDoctorName={initialDoctorName}
              initialTreatmentId={initialTreatmentId}
              initialStatus={initialStatus}
              basePath="/admin/turnos"
            />
          )}
        </main>
      </div>
    );
  }

  const appointments = await getRecentAppointmentList();
  const allDoctors = await getAllDoctors();
  const activeDoctors = await getActiveDoctors();

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-14">
      <main className="admin-main">
        <section className="flex w-full items-center justify-between gap-4">
          <h1 className="header">Turnos</h1>
          <Button asChild variant="outline" className="shad-primary-btn">
            <Link href="/admin/turnos?new=true">Nuevo turno</Link>
          </Button>
        </section>

        <AppointmentsTable
          data={appointments.documents}
          allDoctors={allDoctors}
          activeDoctors={activeDoctors}
          basePath="/admin/turnos"
        />
      </main>
    </div>
  );
};

export default TurnosPage;
