import { getServerSession } from "next-auth/next";

import { AppointmentsTable } from "@/components/table/AppointmentsTable";
import { listAppointments } from "@/lib/actions/appointment.actions";
import { getActiveDoctors, getAllDoctors } from "@/lib/actions/doctor.actions";
import { authOptions } from "@/lib/auth/authOptions";

// TASK-071: what Secretaria sees first at /recepcion — reported as the
// biggest daily friction point: landing on "Turnos para cobrar" (moved to
// its own route, /recepcion/cobros) instead of the day's actual appointment
// list. Reuses AppointmentsTable/listAppointments (basePath="/recepcion/turnos"
// so Confirmar/Reagendar/Cancelar work exactly as they do there) rather than
// building a second, simpler table — the only difference is the initial
// query is scoped to today instead of every appointment.
function todayLocalDate(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

const RecepcionPage = async () => {
  const [session, todaysAppointments, allDoctors, activeDoctors] =
    await Promise.all([
      getServerSession(authOptions),
      listAppointments({ date: todayLocalDate() }),
      getAllDoctors(),
      getActiveDoctors(),
    ]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-14">
      <main className="admin-main">
        <section className="w-full space-y-4">
          <div className="space-y-1">
            <h1 className="header">
              ¡Hola{session?.user?.name ? `, ${session.user.name}` : ""}! 👋
            </h1>
            <p className="text-dark-700">Turnos de hoy</p>
          </div>

          <AppointmentsTable
            data={todaysAppointments}
            allDoctors={allDoctors}
            activeDoctors={activeDoctors}
            basePath="/recepcion/turnos"
          />
        </section>
      </main>
    </div>
  );
};

export default RecepcionPage;
