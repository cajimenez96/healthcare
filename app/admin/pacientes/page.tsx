import { PatientsList } from "@/components/PatientsList";
import { getActiveDoctors } from "@/lib/actions/doctor.actions";
import { getActiveInsuranceProviders } from "@/lib/actions/insuranceProvider.actions";
import { listPatients } from "@/lib/actions/patient.actions";

// TASK-035: same PatientsList as /recepcion/pacientes, mounted again here so
// Administrador can also list/filter patients — same dual-role split
// TASK-024 established for patient creation (two routes, one shared
// component/action).
// TASK-039: doctors/insuranceProviders are fetched here (same as
// /admin/pacientes/nuevo) and passed through so PatientsList can offer
// contextual patient creation without an extra round trip.
const AdminPatientsPage = async () => {
  const [patients, doctors, insuranceProviders] = await Promise.all([
    listPatients(),
    getActiveDoctors(),
    getActiveInsuranceProviders(),
  ]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-14">
      <main className="admin-main">
        <PatientsList
          initialPatients={patients}
          doctors={doctors}
          insuranceProviders={insuranceProviders}
        />
      </main>
    </div>
  );
};

export default AdminPatientsPage;
