import Link from "next/link";

import { StatCard } from "@/components/StatCard";
import { AppointmentsTable } from "@/components/table/AppointmentsTable";
import { Button } from "@/components/ui/button";
import { getRecentAppointmentList } from "@/lib/actions/appointment.actions";
import { getActiveDoctors, getAllDoctors } from "@/lib/actions/doctor.actions";

const AdminPage = async () => {
  const appointments = await getRecentAppointmentList();
  const allDoctors = await getAllDoctors();
  const activeDoctors = await getActiveDoctors();

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-14">
      <main className="admin-main">
        <section className="flex w-full items-start justify-between gap-4">
          <div className="space-y-4">
            <h1 className="header">Bienvenido 👋</h1>
            <p className="text-dark-700">
              Empezá el día gestionando los turnos nuevos
            </p>
          </div>
          {/* TASK-043: AdminNewAppointmentModal deleted — "Nuevo turno" is
              now the full-page calendar flow at /admin/turnos/nuevo. */}
          <Button asChild variant="outline" className="shad-primary-btn">
            <Link href="/admin/turnos/nuevo">Nuevo turno</Link>
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

        <AppointmentsTable
          data={appointments.documents}
          allDoctors={allDoctors}
          activeDoctors={activeDoctors}
        />
      </main>
    </div>
  );
};

export default AdminPage;
