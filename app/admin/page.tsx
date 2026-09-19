import Link from "next/link";
import { getServerSession } from "next-auth/next";

import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { getRecentAppointmentList } from "@/lib/actions/appointment.actions";
import { authOptions } from "@/lib/auth/authOptions";

// TASK-060: the appointment table (TASK-054's filters) and the "Nuevo turno"
// booking/reschedule flow (TASK-043/049-052/056) both moved to the unified
// /admin/turnos view — this dashboard keeps only the stat cards (TASK-016)
// and now links there instead of hosting either directly.
const AdminPage = async () => {
  const [session, appointments] = await Promise.all([
    getServerSession(authOptions),
    getRecentAppointmentList(),
  ]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-14">
      <main className="admin-main">
        <section className="flex w-full items-start justify-between gap-4">
          <div className="space-y-4">
            <h1 className="header">
              ¡Hola{session?.user?.name ? `, ${session.user.name}` : ""}! 👋
            </h1>
            <p className="text-dark-700">
              Empezá el día gestionando los turnos nuevos
            </p>
          </div>
          <Button asChild variant="outline" className="shad-primary-btn">
            <Link href="/admin/turnos">Ver turnos</Link>
          </Button>
        </section>

        <section className="admin-stat">
          <StatCard
            type="appointments"
            count={appointments.scheduledCount}
            label="Turnos confirmados"
            icon={"/assets/icons/appointments.svg"}
          />
          <StatCard
            type="pending"
            count={appointments.pendingCount}
            label="Turnos pendientes"
            icon={"/assets/icons/pending.svg"}
          />
          <StatCard
            type="cancelled"
            count={appointments.cancelledCount}
            label="Turnos cancelados"
            icon={"/assets/icons/cancelled.svg"}
          />
          <StatCard
            type="completed"
            count={appointments.completedCount}
            label="Turnos finalizados"
            icon={"/assets/icons/check.svg"}
          />
        </section>
      </main>
    </div>
  );
};

export default AdminPage;
