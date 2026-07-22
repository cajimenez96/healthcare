import type { UserRole } from "../repositories/IUserRepository";

const ROLE_HOME_ROUTES: Record<UserRole, string> = {
  Administrador: "/admin",
  Secretaria: "/recepcion",
  Doctor: "/doctor",
  Paciente: "/",
};

export function getRoleHomeRoute(role: UserRole): string {
  return ROLE_HOME_ROUTES[role];
}
