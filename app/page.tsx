import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

// TASK-023: patients have no self-service access at all anymore — onboarding
// is 100% staff-mediated (see createPatient / CreatePatientForm, TASK-024).
// This landing page is now staff-only, pointing straight at /login instead
// of also offering the public self-registration form this page used to
// render (PatientForm, removed along with the rest of the patient portal).
const Home = () => {
  return (
    <div className="flex h-screen max-h-screen">
      <section className="remove-scrollbar container my-auto">
        <div className="sub-container max-w-[496px]">
          <Image
            src="/assets/icons/logo-full.svg"
            height={1000}
            width={1000}
            alt="clinic"
            className="mb-12 h-10 w-fit"
          />

          <section className="space-y-4">
            <h1 className="header">Bienvenido 👋</h1>
            <p className="text-dark-700">
              Sistema de gestión clínica. El acceso es exclusivo para el
              personal de la clínica.
            </p>
          </section>

          <Button asChild className="shad-primary-btn mt-8 w-full">
            <Link href="/login">Ingresar</Link>
          </Button>

          <p className="text-14-regular mt-8 text-dark-600">
            © 2024 CarePluse
          </p>
        </div>
      </section>

      <Image
        src="/assets/images/onboarding-img.png"
        height={1000}
        width={1000}
        alt="clinic"
        className="side-img max-w-[50%]"
      />
    </div>
  );
};

export default Home;
