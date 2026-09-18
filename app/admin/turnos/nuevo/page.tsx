import { NewAppointmentView } from "@/components/NewAppointmentView";
import { getActiveDoctors } from "@/lib/actions/doctor.actions";
import { getActiveInsuranceProviders } from "@/lib/actions/insuranceProvider.actions";
import { getActiveTreatments } from "@/lib/actions/treatment.actions";

// TASK-043: replaces AdminNewAppointmentModal (TASK-018/024) as the only way
// to book an appointment from /admin — a full page instead of a small
// dialog, so the doctor's week calendar (react-big-calendar, TASK-043) has
// room to render. insuranceProviders is only needed here to hand through to
// CreatePatientModal's "Crear paciente" fallback (TASK-039), same as
// /admin/pacientes/nuevo.
const NewAppointmentPage = async () => {
  const [doctors, treatments, insuranceProviders] = await Promise.all([
    getActiveDoctors(),
    getActiveTreatments(),
    getActiveInsuranceProviders(),
  ]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-14">
      <main className="admin-main">
        <NewAppointmentView
          doctors={doctors}
          treatments={treatments}
          insuranceProviders={insuranceProviders}
        />
      </main>
    </div>
  );
};

export default NewAppointmentPage;
