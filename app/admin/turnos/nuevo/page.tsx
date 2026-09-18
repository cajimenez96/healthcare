import { NewAppointmentView } from "@/components/NewAppointmentView";
import { getAppointment } from "@/lib/actions/appointment.actions";
import { getActiveDoctors } from "@/lib/actions/doctor.actions";
import { getActiveInsuranceProviders } from "@/lib/actions/insuranceProvider.actions";
import { getPatientForAppointment } from "@/lib/actions/patient.actions";
import { getActiveTreatments } from "@/lib/actions/treatment.actions";

// TASK-043: replaces AdminNewAppointmentModal (TASK-018/024) as the only way
// to book an appointment from /admin — a full page instead of a small
// dialog, so the doctor's week calendar (react-big-calendar, TASK-043) has
// room to render. insuranceProviders is only needed here to hand through to
// CreatePatientModal's "Crear paciente" fallback (TASK-039), same as
// /admin/pacientes/nuevo.
//
// TASK-056: also the reschedule entry point for an existing appointment, via
// an optional ?appointmentId= query param — same pattern as
// /doctor/patient/[id]?appointmentId= (TASK-008). When present, this fetches
// that appointment (getAppointment) and its patient (getPatientForAppointment)
// and hands them to NewAppointmentView as initial values; it stays the same
// create-mode page otherwise. The old "Confirmar turno"
// AppointmentModal/AppointmentForm dialog this replaces is gone — columns.tsx
// now links here with ?appointmentId= instead.
const NewAppointmentPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const resolvedSearchParams = await searchParams;
  const appointmentId = (resolvedSearchParams?.appointmentId as string) || "";

  const [doctors, treatments, insuranceProviders] = await Promise.all([
    getActiveDoctors(),
    getActiveTreatments(),
    getActiveInsuranceProviders(),
  ]);

  let rescheduleError = false;
  let initialPatient;
  let initialDoctorName: string | undefined;
  let initialTreatmentId: string | undefined;

  if (appointmentId) {
    const appointment = await getAppointment(appointmentId);
    const patient = appointment
      ? await getPatientForAppointment(appointment.patientId)
      : undefined;

    if (appointment && patient) {
      initialPatient = patient;
      initialDoctorName = appointment.primaryPhysician;
      initialTreatmentId = appointment.treatmentId;
    } else {
      rescheduleError = true;
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-14">
      <main className="admin-main">
        {rescheduleError ? (
          <section className="w-full max-w-4xl space-y-2">
            <h1 className="header">Turno no encontrado</h1>
            <p className="shad-error text-14-regular">
              No se pudo cargar el turno a reagendar. Puede que ya no exista.
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
          />
        )}
      </main>
    </div>
  );
};

export default NewAppointmentPage;
