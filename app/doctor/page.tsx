import Image from "next/image";
import Link from "next/link";

import { StatusBadge } from "@/components/StatusBadge";
import { getMyAppointments } from "@/lib/actions/appointment.actions";
import { formatDateTime } from "@/lib/utils";

interface DoctorAppointment {
  $id: string;
  schedule: string;
  status: Status;
  reason: string;
  patient: { $id: string; name: string };
}

const DoctorPage = async () => {
  const appointments: DoctorAppointment[] = await getMyAppointments();

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-14">
      <header className="admin-header">
        <Link href="/doctor" className="cursor-pointer">
          <Image
            src="/assets/icons/logo-full.svg"
            height={32}
            width={162}
            alt="logo"
            className="h-8 w-fit"
          />
        </Link>

        <p className="text-16-semibold">Mi agenda</p>
      </header>

      <main className="admin-main">
        <section className="w-full space-y-4">
          <h1 className="header">Mis turnos</h1>
          <ul className="space-y-4">
            {appointments.map((appointment) => (
              <li
                key={appointment.$id}
                className="flex items-center gap-4 border-b border-dark-500 pb-4"
              >
                <div className="flex-1">
                  <p className="text-14-medium">{appointment.patient.name}</p>
                  <p className="text-12-regular text-dark-700">
                    {formatDateTime(appointment.schedule).dateTime} ·{" "}
                    {appointment.reason}
                  </p>
                </div>
                <StatusBadge status={appointment.status} />
                <Link
                  href={`/doctor/patient/${appointment.patient.$id}?appointmentId=${appointment.$id}`}
                  className="text-green-500"
                >
                  Ver ficha
                </Link>
              </li>
            ))}
            {appointments.length === 0 && (
              <p className="text-dark-700">No tenés turnos asignados.</p>
            )}
          </ul>
        </section>
      </main>
    </div>
  );
};

export default DoctorPage;
