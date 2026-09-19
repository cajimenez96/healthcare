import {
  LayoutDashboard,
  Users,
  Stethoscope,
  ClipboardList,
  ShieldCheck,
  Receipt,
  CalendarPlus,
} from "lucide-react";

import { RoleLayout } from "@/components/RoleLayout";

// TASK-037: shared nav for every /admin/** screen, replacing the
// per-page `<header className="admin-header">` that used to duplicate these
// links (and "Volver"/logout) on each page individually.
// TASK-058: header/logo/container JSX itself now lives in RoleLayout, shared
// with app/doctor/layout.tsx and app/recepcion/layout.tsx.
const iconClass = "size-5 shrink-0";

const ADMIN_NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className={iconClass} /> },
  // TASK-060: points at the unified list (same "nav → management screen"
  // pattern as every other item here) — /admin/turnos has its own "Nuevo
  // turno" button for the create action, same shape as Pacientes below.
  { label: "Turnos", href: "/admin/turnos", icon: <CalendarPlus className={iconClass} /> },
  // TASK-059: "Nuevo paciente" removed — /admin/pacientes is now the single
  // destination for creating, listing, editing and deactivating patients
  // (Dialog-based "Crear paciente", same pattern as TASK-034's other
  // entities), so the standalone /admin/pacientes/nuevo route/nav entry no
  // longer exists.
  { label: "Pacientes", href: "/admin/pacientes", icon: <Users className={iconClass} /> },
  { label: "Doctores", href: "/admin/doctors", icon: <Stethoscope className={iconClass} /> },
  { label: "Secretarías", href: "/admin/secretarias", icon: <ClipboardList className={iconClass} /> },
  { label: "Administradores", href: "/admin/admins", icon: <ShieldCheck className={iconClass} /> },
  { label: "Nomenclador", href: "/admin/treatments", icon: <Receipt className={iconClass} /> },
];

const AdminLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return (
    <RoleLayout
      navItems={ADMIN_NAV_ITEMS}
      homeHref="/admin"
      maxWidth="7xl"
      containerClassName="mb-5 mt-2"
    >
      {children}
    </RoleLayout>
  );
};

export default AdminLayout;
