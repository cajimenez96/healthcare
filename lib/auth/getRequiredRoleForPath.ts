import type { UserRole } from "../repositories/IUserRepository";

const PROTECTED_ROUTE_ROLES: Array<[prefix: string, role: UserRole]> = [
  ["/admin", "Administrador"],
  ["/doctor", "Doctor"],
  ["/recepcion", "Secretaria"],
];

export function getRequiredRoleForPath(pathname: string): UserRole | undefined {
  return PROTECTED_ROUTE_ROLES.find(([prefix]) => pathname.startsWith(prefix))?.[1];
}
