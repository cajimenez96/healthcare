import Image from "next/image";
import Link from "next/link";

import { DoctorRow } from "@/components/DoctorRow";
import DoctorForm from "@/components/forms/DoctorForm";
import { getAllDoctors } from "@/lib/actions/doctor.actions";

const DoctorsPage = async () => {
  const doctors = await getAllDoctors();

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-14">
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

        <p className="text-16-semibold">Doctores</p>
      </header>

      <main className="admin-main">
        <section className="w-full space-y-4">
          <h1 className="header">Doctores</h1>
          <ul className="space-y-4">
            {doctors.map(
              (doctor: {
                id: string;
                name: string;
                specialty: string;
                licenseNumber: string;
                image: string;
                isActive: boolean;
                availability: {
                  dayOfWeek: number;
                  startTime: string;
                  endTime: string;
                }[];
              }) => (
                <DoctorRow key={doctor.id} doctor={doctor} />
              ),
            )}
            {doctors.length === 0 && (
              <p className="text-dark-700">Todavía no hay doctores cargados.</p>
            )}
          </ul>
        </section>

        <section className="w-full max-w-lg space-y-4">
          <h2 className="header">Alta de doctor</h2>
          <DoctorForm />
        </section>
      </main>
    </div>
  );
};

export default DoctorsPage;
