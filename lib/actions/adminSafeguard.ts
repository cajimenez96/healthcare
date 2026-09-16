// Pure helper — deliberately has no "use server", auth, or DB imports so it
// stays importable (and unit-testable) without pulling in the
// requireAdminSession -> authOptions -> MONGODB_URI chain, and so it can live
// outside the "use server" adminUser.actions.ts module (every export of a
// "use server" file must be an async Server Action, which a plain boolean
// helper is not).

import type { UserRecord } from "../repositories/IUserRepository";

// Last-active-Administrador safeguard: decides whether deactivating
// `targetId` would leave the system with zero active Administradores.
export function isLastActiveAdmin(
  admins: UserRecord[],
  targetId: string,
): boolean {
  const otherActiveAdmins = admins.filter(
    (admin) => admin.id !== targetId && admin.isActive !== false,
  );
  return otherActiveAdmins.length === 0;
}
