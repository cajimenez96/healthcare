import Image from "next/image";
import Link from "next/link";

import DoctorForm from "@/components/forms/DoctorForm";
import { getActiveDoctors } from "@/lib/actions/doctor.actions";

const DoctorsPage = async () => {
  const doctors = await getActiveDoctors();

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
          <h1 className="header">Doctores activos</h1>
          <ul className="space-y-4">
            {doctors.map((doctor: { id: string; name: string; specialty: string; licenseNumber: string; image: string }) => (
              <li key={doctor.id} className="flex items-center gap-4">
                <Image
                  src={doctor.image}
                  alt={doctor.name}
                  width={40}
                  height={40}
                  className="rounded-full border border-dark-500"
                />
                <div>
                  <p className="text-14-medium">{doctor.name}</p>
                  <p className="text-dark-700 text-12-regular">
                    {doctor.specialty} · {doctor.licenseNumber}
                  </p>
                </div>
              </li>
            ))}
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
