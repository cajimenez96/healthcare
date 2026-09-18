import CreatePatientForm from "@/components/forms/CreatePatientForm";
import { getActiveDoctors } from "@/lib/actions/doctor.actions";
import { getActiveInsuranceProviders } from "@/lib/actions/insuranceProvider.actions";

// TASK-024: primary staff-side patient creation flow, for Secretaria.
// middleware.ts already restricts /recepcion/* to that role; createPatient
// (the Server Action this form calls) re-checks the session itself as
// defense in depth, same pattern as every other mutation in this app.
const NewPatientPage = async () => {
  const doctors = await getActiveDoctors();
  const insuranceProviders = await getActiveInsuranceProviders();

  return (
    <div className="mx-auto flex max-w-4xl flex-col space-y-14">
      <main className="admin-main">
        <CreatePatientForm doctors={doctors} insuranceProviders={insuranceProviders} />
      </main>
    </div>
  );
};

export default NewPatientPage;
