import {
  LayoutDashboard,
  UserPlus,
  Users,
  Stethoscope,
  ClipboardList,
  ShieldCheck,
  Receipt,
  CalendarPlus,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { AppSidebarNav } from "@/components/AppSidebarNav";

// TASK-037: shared nav for every /admin/** screen, replacing the
// per-page `<header className="admin-header">` that used to duplicate these
// links (and "Volver"/logout) on each page individually.
const iconClass = "size-5 shrink-0";

const ADMIN_NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className={iconClass} /> },
  // TASK-043: replaces the "Nuevo turno" button that used to live only on
  // /admin (AdminNewAppointmentModal, now deleted) — the full-page calendar
  // flow needs a permanent nav entry like every other admin screen.
  { label: "Nuevo turno", href: "/admin/turnos/nuevo", icon: <CalendarPlus className={iconClass} /> },
  { label: "Nuevo paciente", href: "/admin/pacientes/nuevo", icon: <UserPlus className={iconClass} /> },
  { label: "Pacientes", href: "/admin/pacientes", icon: <Users className={iconClass} /> },
  { label: "Doctores", href: "/admin/doctors", icon: <Stethoscope className={iconClass} /> },
  { label: "Secretarías", href: "/admin/secretarias", icon: <ClipboardList className={iconClass} /> },
  { label: "Administradores", href: "/admin/admins", icon: <ShieldCheck className={iconClass} /> },
  { label: "Nomenclador", href: "/admin/treatments", icon: <Receipt className={iconClass} /> },
];

const AdminLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return (
    <>
      <div className="mx-auto mb-5 mt-2 flex max-w-7xl flex-col">
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

          <AppSidebarNav items={ADMIN_NAV_ITEMS} />
        </header>
      </div>
      {children}
    </>
  );
};

export default AdminLayout;
