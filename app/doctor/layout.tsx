import { CalendarDays } from "lucide-react";

import { RoleLayout } from "@/components/RoleLayout";

// TASK-037: shared nav for /doctor. Only one screen exists for this role
// today, but this mirrors the admin/recepcion layouts so logout lives in one
// place instead of being duplicated per page header.
// TASK-058: header/logo/container JSX itself now lives in RoleLayout, shared
// with app/admin/layout.tsx and app/recepcion/layout.tsx.
const DOCTOR_NAV_ITEMS = [
  {
    label: "Mi agenda",
    href: "/doctor",
    icon: <CalendarDays className="size-5 shrink-0" />,
  },
];

const DoctorLayout = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  return (
    <RoleLayout
      navItems={DOCTOR_NAV_ITEMS}
      homeHref="/doctor"
      maxWidth="7xl"
      containerClassName="mb-5 mt-2"
    >
      {children}
    </RoleLayout>
  );
};

export default DoctorLayout;
