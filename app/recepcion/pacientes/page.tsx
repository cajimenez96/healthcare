import { PatientsList } from "@/components/PatientsList";
import { getActiveDoctors } from "@/lib/actions/doctor.actions";
import { getActiveInsuranceProviders } from "@/lib/actions/insuranceProvider.actions";
import { listPatients } from "@/lib/actions/patient.actions";

// TASK-035: primary listing screen, mirrors how patient creation
// (TASK-024) is primarily a Secretaria/front-desk task. Same
// PatientsList shared with /admin/pacientes.
// TASK-039/059: doctors/insuranceProviders fetched here so PatientsList can
// offer both contextual and always-visible patient creation (Dialog-based,
// no separate /nuevo route since TASK-059) — also reused by
// EditPatientForm's pickers.
const PatientsPage = async () => {
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

export default PatientsPage;
