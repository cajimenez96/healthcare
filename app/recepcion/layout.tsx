import Image from "next/image";
import Link from "next/link";

import { AppSidebarNav } from "@/components/AppSidebarNav";

// TASK-037: shared nav for every /recepcion/** screen, replacing the
// per-page `<header className="admin-header">` duplicated across
// /recepcion, /recepcion/pacientes and /recepcion/pacientes/nuevo.
const SECRETARIA_NAV_ITEMS = [
  { label: "Recepción", href: "/recepcion" },
  { label: "Nuevo paciente", href: "/recepcion/pacientes/nuevo" },
  { label: "Pacientes", href: "/recepcion/pacientes" },
];

const RecepcionLayout = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  return (
    <>
      <div className="mx-auto flex max-w-4xl flex-col">
        <header className="admin-header">
          <Link href="/recepcion" className="cursor-pointer">
            <Image
              src="/assets/icons/logo-full.svg"
              height={32}
              width={162}
              alt="logo"
              className="h-8 w-fit"
            />
          </Link>

          <AppSidebarNav items={SECRETARIA_NAV_ITEMS} />
        </header>
      </div>
      {children}
    </>
  );
};

export default RecepcionLayout;
