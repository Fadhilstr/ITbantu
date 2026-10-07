import test from "node:test";
import assert from "node:assert/strict";

const ROLES = {
  ADMIN: "ADMIN",
  IT_SUPERVISOR: "IT_SUPERVISOR",
  IT_STAFF: "IT_STAFF",
  USER: "USER",
};

function canViewInternalNotes(user) {
  return user?.role === ROLES.IT_STAFF || user?.role === ROLES.IT_SUPERVISOR || user?.role === ROLES.ADMIN;
}

function canResolveTicket(user) {
  return user?.role === ROLES.IT_STAFF || user?.role === ROLES.IT_SUPERVISOR || user?.role === ROLES.ADMIN;
}

function canCloseTicket(user, creatorId) {
  if (!user) return false;
  if (user.role === ROLES.ADMIN || user.role === ROLES.IT_SUPERVISOR) return true;
  return user.id === creatorId;
}

function canReopenTicket(user, creatorId) {
  if (!user) return false;
  if (user.role === ROLES.ADMIN) return true;
  return user.id === creatorId;
}

function canViewTicket(user, ticket) {
  if (!user) return false;
  if (user.role === ROLES.ADMIN || user.role === ROLES.IT_SUPERVISOR || user.role === ROLES.IT_STAFF) return true;
  return user.id === ticket.userId;
}

test("RBAC: Role permission boundaries", () => {
  const admin = { id: "admin-1", role: "ADMIN" };
  const supervisor = { id: "spv-1", role: "IT_SUPERVISOR" };
  const staff = { id: "staff-1", role: "IT_STAFF" };
  const user = { id: "user-1", role: "USER" };
  const otherUser = { id: "user-2", role: "USER" };

  const userTicket = { id: "tkt-1", userId: "user-1" };

  // Internal note permissions
  assert.equal(canViewInternalNotes(admin), true);
  assert.equal(canViewInternalNotes(supervisor), true);
  assert.equal(canViewInternalNotes(staff), true);
  assert.equal(canViewInternalNotes(user), false);

  // Ticket resolution permissions
  assert.equal(canResolveTicket(staff), true);
  assert.equal(canResolveTicket(user), false);

  // Close ticket permissions
  assert.equal(canCloseTicket(user, userTicket.userId), true);
  assert.equal(canCloseTicket(otherUser, userTicket.userId), false);
  assert.equal(canCloseTicket(admin, userTicket.userId), true);

  // Reopen ticket permissions
  assert.equal(canReopenTicket(user, userTicket.userId), true);
  assert.equal(canReopenTicket(otherUser, userTicket.userId), false);
  assert.equal(canReopenTicket(staff, userTicket.userId), false); // Staff cannot reopen for user

  // Ticket view authorization (IDOR prevention)
  assert.equal(canViewTicket(user, userTicket), true);
  assert.equal(canViewTicket(otherUser, userTicket), false);
  assert.equal(canViewTicket(staff, userTicket), true);
});

