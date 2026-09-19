import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { AppSidebarNav, type AppNavItem } from "@/components/AppSidebarNav";
import { cn } from "@/lib/utils";

// TASK-058: extracted from app/admin/layout.tsx, app/doctor/layout.tsx and
// app/recepcion/layout.tsx (TASK-037), which had grown into near-identical
// logo/header/AppSidebarNav/container JSX duplicated three times. The only
// things that actually vary per role are the nav items, the logo's home
// link, and the container width (plus admin's pre-existing extra
// "mb-5 mt-2" spacing, preserved here via `containerClassName` rather than
// silently dropped or added to the other roles).
type RoleLayoutMaxWidth = "7xl" | "4xl";

const MAX_WIDTH_CLASSES: Record<RoleLayoutMaxWidth, string> = {
  "7xl": "max-w-7xl",
  "4xl": "max-w-4xl",
};

interface RoleLayoutProps {
  navItems: AppNavItem[];
  homeHref: string;
  maxWidth: RoleLayoutMaxWidth;
  containerClassName?: string;
  children: ReactNode;
}

export const RoleLayout = ({
  navItems,
  homeHref,
  maxWidth,
  containerClassName,
  children,
}: RoleLayoutProps) => {
  return (
    <>
      <div
        className={cn(
          "mx-auto flex flex-col",
          MAX_WIDTH_CLASSES[maxWidth],
          containerClassName,
        )}
      >
        <header className="admin-header">
          <Link href={homeHref} className="cursor-pointer">
            <Image
              src="/assets/icons/logo-full.svg"
              height={32}
              width={162}
              alt="logo"
              className="h-8 w-fit"
            />
          </Link>

          <AppSidebarNav items={navItems} />
        </header>
      </div>
      {children}
    </>
  );
};
