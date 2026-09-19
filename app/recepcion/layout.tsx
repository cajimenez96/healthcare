import { CalendarPlus, Home, Users, Wallet } from "lucide-react";

import { RoleLayout } from "@/components/RoleLayout";

const iconClass = "size-5 shrink-0";

// TASK-037: shared nav for every /recepcion/** screen, replacing the
// per-page `<header className="admin-header">` duplicated across
// /recepcion and /recepcion/pacientes.
// TASK-058: header/logo/container JSX itself now lives in RoleLayout, shared
// with app/admin/layout.tsx and app/doctor/layout.tsx.
// TASK-059: "Nuevo paciente" removed — /recepcion/pacientes is now the
// single destination for creating, listing, editing and deactivating
// patients (Dialog-based "Crear paciente"), so the standalone
// /recepcion/pacientes/nuevo route/nav entry no longer exists.
// TASK-063: "Turnos" points at the unified listado (same "nav → management
// screen" pattern as ADMIN_NAV_ITEMS's own "Turnos" entry, TASK-060) —
// /recepcion/turnos has its own "Nuevo turno" button for the create action.
// TASK-071: "Recepción" (home) now shows today's turnos instead of billing —
// "Cobros" is billing's own new destination/nav item.
const SECRETARIA_NAV_ITEMS = [
  { label: "Recepción", href: "/recepcion", icon: <Home className={iconClass} /> },
  {
    label: "Turnos",
    href: "/recepcion/turnos",
    icon: <CalendarPlus className={iconClass} />,
  },
  { label: "Pacientes", href: "/recepcion/pacientes", icon: <Users className={iconClass} /> },
  { label: "Cobros", href: "/recepcion/cobros", icon: <Wallet className={iconClass} /> },
];

const RecepcionLayout = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  return (
    <RoleLayout
      navItems={SECRETARIA_NAV_ITEMS}
      homeHref="/recepcion"
      maxWidth="7xl"
      containerClassName="mb-5 mt-2"
    >
      {children}
    </RoleLayout>
  );
};

export default RecepcionLayout;
