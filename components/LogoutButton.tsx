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
      className="text-green-500"
    >
      Cerrar sesión
    </button>
  );
};
