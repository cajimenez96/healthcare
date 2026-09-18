"use client";

import { signOut } from "next-auth/react";

// TASK-030: admin/doctor/recepcion pages are Server Components, so the
// signOut() call (client-only, needs next-auth/react's context) lives in
// this small client island instead of converting each page to "use client".
export const LogoutButton = () => {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-md bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700"
    >
      Cerrar sesión
    </button>
  );
};
