import Image from "next/image";
import Link from "next/link";

import CreatePatientForm from "@/components/forms/CreatePatientForm";
import { getActiveDoctors } from "@/lib/actions/doctor.actions";
import { getActiveInsuranceProviders } from "@/lib/actions/insuranceProvider.actions";

// TASK-024: same CreatePatientForm as /recepcion/pacientes/nuevo, mounted
// again here so Administrador can also create a patient directly — two
// routes sharing one component/action rather than reshaping
// getRequiredRoleForPath's one-role-per-prefix model. middleware.ts already
// restricts /admin/* to Administrador; createPatient re-checks server-side.
const NewPatientPage = async () => {
  const doctors = await getActiveDoctors();
  const insuranceProviders = await getActiveInsuranceProviders();

  return (
    <div className="mx-auto flex max-w-4xl flex-col space-y-14">
      <header className="admin-header">
        <Link href="/admin" className="cursor-pointer">
          <Image
            src="/assets/icons/logo-full.svg"
            height={32}
            width={162}
            alt="logo"
            className="h-8 w-fit"
          />
        </Link>

        <p className="text-16-semibold">Panel de Administración</p>
        <Link href="/admin" className="text-green-500">
          Volver
        </Link>
      </header>

      <main className="admin-main">
        <CreatePatientForm doctors={doctors} insuranceProviders={insuranceProviders} />
      </main>
    </div>
  );
};

export default NewPatientPage;
