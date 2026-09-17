import Image from "next/image";
import Link from "next/link";

import { CreateDoctorModal } from "@/components/CreateDoctorModal";
import { DoctorRow } from "@/components/DoctorRow";
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
        <Link href="/admin" className="text-green-500">
          Volver
        </Link>
      </header>

      <main className="admin-main">
        <section className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="header">Doctores</h1>
            <CreateDoctorModal />
          </div>
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
      </main>
    </div>
  );
};

export default DoctorsPage;
