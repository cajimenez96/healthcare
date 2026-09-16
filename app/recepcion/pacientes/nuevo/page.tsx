import Image from "next/image";
import Link from "next/link";

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
      <header className="admin-header">
        <Link href="/recepcion" className="cursor-pointer">
          <Image
            src="/assets/icons/logo-full.svg"
            height={32}
            width={162}
            alt="logo"
            className="h-8 w-fit"
          />
        </Link>

        <p className="text-16-semibold">Recepción</p>
      </header>

      <main className="admin-main">
        <CreatePatientForm doctors={doctors} insuranceProviders={insuranceProviders} />
      </main>
    </div>
  );
};

export default NewPatientPage;
