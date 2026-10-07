import { AuthUser } from "./auth";

export const ROLES = {
  ADMIN: "ADMIN",
  IT_SUPERVISOR: "IT_SUPERVISOR",
  IT_STAFF: "IT_STAFF",
  USER: "USER",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === ROLES.ADMIN;
}

export function isSupervisor(user: AuthUser | null): boolean {
  return user?.role === ROLES.IT_SUPERVISOR || user?.role === ROLES.ADMIN;
}

export function isItStaff(user: AuthUser | null): boolean {
  return (
    user?.role === ROLES.IT_STAFF ||
    user?.role === ROLES.IT_SUPERVISOR ||
    user?.role === ROLES.ADMIN
  );
}

export function isEndUser(user: AuthUser | null): boolean {
  return user?.role === ROLES.USER;
}

export function canAccessAdmin(user: AuthUser | null): boolean {
  return isAdmin(user);
}

export function canViewInternalNotes(user: AuthUser | null): boolean {
  return isItStaff(user);
}

export function canCreateInternalNotes(user: AuthUser | null): boolean {
  return isItStaff(user);
}

export function canAssignTicket(user: AuthUser | null): boolean {
  return isSupervisor(user) || isAdmin(user);
}

export function canClaimTicket(user: AuthUser | null): boolean {
  return isItStaff(user);
}

export function canResolveTicket(user: AuthUser | null): boolean {
  return isItStaff(user);
}

export function canCloseTicket(user: AuthUser | null, ticketCreatorId: string): boolean {
  if (!user) return false;
  if (isAdmin(user) || isSupervisor(user)) return true;
  return user.id === ticketCreatorId;
}

export function canReopenTicket(user: AuthUser | null, ticketCreatorId: string): boolean {
  if (!user) return false;
  if (isAdmin(user)) return true;
  return user.id === ticketCreatorId;
}

export function canViewTicket(
  user: AuthUser | null,
  ticket: {
    userId: string;
    assignedStaffId?: string | null;
    assignedTeamId?: string | null;
  }
): boolean {
  if (!user) return false;
  if (isAdmin(user) || isSupervisor(user)) return true;
  if (user.id === ticket.userId) return true;
  if (user.role === ROLES.IT_STAFF) {
    if (ticket.assignedStaffId === user.id) return true;
    if (user.itTeamId && ticket.assignedTeamId === user.itTeamId) return true;
    // Allow IT staff to view tickets for collaboration
    return true;
  }
  return false;
}

