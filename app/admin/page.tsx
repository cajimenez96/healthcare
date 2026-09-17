import Image from "next/image";
import Link from "next/link";

import { AdminNewAppointmentModal } from "@/components/AdminNewAppointmentModal";
import { LogoutButton } from "@/components/LogoutButton";
import { StatCard } from "@/components/StatCard";
import { AppointmentsTable } from "@/components/table/AppointmentsTable";
import { getRecentAppointmentList } from "@/lib/actions/appointment.actions";
import { getActiveDoctors, getAllDoctors } from "@/lib/actions/doctor.actions";

const AdminPage = async () => {
  const appointments = await getRecentAppointmentList();
  const allDoctors = await getAllDoctors();
  const activeDoctors = await getActiveDoctors();

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-14">
      <header className="admin-header">
        <Link href="/" className="cursor-pointer">
          <Image
            src="/assets/icons/logo-full.svg"
            height={32}
            width={162}
            alt="logo"
            className="h-8 w-fit"
          />
        </Link>

        <p className="text-16-semibold">Panel de Administración</p>

        <Link href="/admin/pacientes/nuevo" className="text-green-500">
          Nuevo paciente
        </Link>
        <Link href="/admin/doctors" className="text-green-500">
          Doctores
        </Link>
        <Link href="/admin/secretarias" className="text-green-500">
          Secretarías
        </Link>
        <Link href="/admin/admins" className="text-green-500">
          Administradores
        </Link>
        <Link href="/admin/treatments" className="text-green-500">
          Nomenclador
        </Link>
        <LogoutButton />
      </header>

      <main className="admin-main">
        <section className="flex w-full items-start justify-between gap-4">
          <div className="space-y-4">
            <h1 className="header">Bienvenido 👋</h1>
            <p className="text-dark-700">
              Empezá el día gestionando los turnos nuevos
            </p>
          </div>
          <AdminNewAppointmentModal doctors={activeDoctors} />
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
