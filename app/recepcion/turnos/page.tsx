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

// TASK-063: mirrors app/admin/turnos/page.tsx (TASK-060) exactly, giving
// Secretaria the same unified listado + filtros + agendar/reagendar view
// Admin already has, reusing NewAppointmentView/AppointmentsTable/columns.tsx
// as-is instead of forking them. Same searchParams-driven toggle
// (`?appointmentId=` for reschedule, `?new=true` for a fresh booking, no
// client state) — both modes stay shareable URLs with working browser
// back/forward, same as /admin/turnos. The only real difference from the
// admin page is `basePath="/recepcion/turnos"` passed down to
// AppointmentsTable/NewAppointmentView, so "Reagendar" and the post-booking
// redirect stay inside /recepcion instead of pointing at the admin-only
// route (which middleware.ts would then block for Secretaria).
const RecepcionTurnosPage = async ({
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
            href="/recepcion/turnos"
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
              basePath="/recepcion/turnos"
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
            <Link href="/recepcion/turnos?new=true">Nuevo turno</Link>
          </Button>
        </section>

        <AppointmentsTable
          data={appointments.documents}
          allDoctors={allDoctors}
          activeDoctors={activeDoctors}
          basePath="/recepcion/turnos"
        />
      </main>
    </div>
  );
};

export default RecepcionTurnosPage;
