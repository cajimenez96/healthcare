import Image from "next/image";
import Link from "next/link";

import { AppSidebarNav } from "@/components/AppSidebarNav";

// TASK-037: shared nav for /doctor. Only one screen exists for this role
// today, but this mirrors the admin/recepcion layouts so logout lives in one
// place instead of being duplicated per page header.
const DOCTOR_NAV_ITEMS = [{ label: "Mi agenda", href: "/doctor" }];

const DoctorLayout = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  return (
    <>
      <div className="mx-auto flex max-w-7xl flex-col">
        <header className="admin-header">
          <Link href="/doctor" className="cursor-pointer">
            <Image
              src="/assets/icons/logo-full.svg"
              height={32}
              width={162}
              alt="logo"
              className="h-8 w-fit"
            />
          </Link>

          <AppSidebarNav items={DOCTOR_NAV_ITEMS} />
        </header>
      </div>
      {children}
    </>
  );
};

export default DoctorLayout;
