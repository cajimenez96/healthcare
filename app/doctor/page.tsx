import Link from "next/link";
import { getServerSession } from "next-auth/next";

import { StatusBadge } from "@/components/StatusBadge";
import { getMyAppointments } from "@/lib/actions/appointment.actions";
import { authOptions } from "@/lib/auth/authOptions";
import { formatDateTime } from "@/lib/utils";

interface DoctorAppointment {
  $id: string;
  schedule: string;
  status: Status;
  reason: string;
  patient: { $id: string; name: string };
}

const DoctorPage = async () => {
  const [session, { appointments, hasLinkedProfile }] = await Promise.all([
    getServerSession(authOptions),
    getMyAppointments() as Promise<{
      appointments: DoctorAppointment[];
      hasLinkedProfile: boolean;
    }>,
  ]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-14">
      <main className="admin-main">
        <section className="w-full space-y-4">
          <div className="space-y-1">
            <h1 className="header">
              ¡Hola{session?.user?.name ? `, ${session.user.name}` : ""}! 👋
            </h1>
            <p className="text-dark-700">Mis turnos</p>
          </div>
          {!hasLinkedProfile && (
            <p className="shad-error text-14-regular">
              Tu usuario no tiene un perfil de doctor vinculado, contactá al Administrador.
            </p>
          )}
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
            {appointments.length === 0 && hasLinkedProfile && (
              <p className="text-dark-700">No tenés turnos asignados.</p>
            )}
          </ul>
        </section>
      </main>
    </div>
  );
};

export default DoctorPage;
