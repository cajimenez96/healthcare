"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";

import { LogoutButton } from "@/components/LogoutButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface AppNavItem {
  label: string;
  href: string;
  // Pre-rendered element, not a component reference: this crosses the
  // Server -> Client boundary (AdminLayout etc. are Server Components,
  // AppSidebarNav is "use client"), and only plain serializable React
  // elements survive that trip — a raw component/function reference doesn't.
  icon?: ReactNode;
}

interface AppSidebarNavProps {
  items: AppNavItem[];
}

// TASK-037: shared offcanvas nav used by app/admin/layout.tsx,
// app/doctor/layout.tsx and app/recepcion/layout.tsx, one per role. Reuses
// the same Radix Dialog primitives as components/ui/dialog.tsx (already used
// for TASK-034's modals), but the content is styled and positioned here as a
// side-sliding drawer instead of reusing the exported <DialogContent> (which
// is hardcoded as a centered modal) — building a new "sheet" variant on top
// of the same Dialog/DialogPortal/DialogOverlay/DialogClose primitives keeps
// every other modal in the app (AdminNewAppointmentModal, CreateDoctorModal,
// etc.) untouched, and avoids fighting Tailwind's class-merging against the
// centered modal's hardcoded position/animation classes.
export const AppSidebarNav = ({ items }: AppSidebarNavProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Abrir menú de navegación"
          className="text-green-500 hover:text-green-500"
        >
          <Menu className="size-6" />
        </Button>
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 flex h-full w-72 max-w-[80vw] flex-col gap-6 border-r border-dark-500 bg-dark-200 p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left-full data-[state=open]:slide-in-from-left-full">
          <DialogTitle className="text-16-semibold text-white">
            Menú
          </DialogTitle>

          <nav className="mt-4 flex flex-1 flex-col gap-2">
            {items.map((item) => (
              <DialogClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className="flex cursor-pointer items-center gap-2 rounded-md p-2.5 text-green-500 hover:bg-green-500/10 hover:text-white"
                >
                  {item.icon}
                  {item.label}
                </Link>
              </DialogClose>
            ))}
          </nav>

          <LogoutButton />

          <DialogPrimitive.Close
            aria-label="Cerrar menú"
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="size-4" />
            <span className="sr-only">Cerrar</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};
