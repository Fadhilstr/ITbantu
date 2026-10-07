import test from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

test("Workflow: End-to-end ticket lifecycle test", async () => {
  // 1. Get test users & services
  const user = await prisma.user.findFirst({ where: { role: { name: "USER" } } });
  const staff = await prisma.user.findFirst({ where: { role: { name: "IT_STAFF" } } });
  const service = await prisma.service.findFirst({ include: { categories: true } });

  assert.ok(user, "User must exist");
  assert.ok(staff, "IT Staff must exist");
  assert.ok(service, "Service must exist");

  const category = service.categories[0];
  assert.ok(category, "Category must exist");

  // 2. Generate unique ticket number
  const testNumber = `INC-2026-TEST-${Date.now().toString().slice(-5)}`;
  const now = new Date();
  const responseDueAt = new Date(now.getTime() + 30 * 60 * 1000);
  const resolutionDueAt = new Date(now.getTime() + 240 * 60 * 1000);

  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber: testNumber,
      type: "INCIDENT",
      subject: "Test E2E Incident Ticket",
      description: "Testing automated lifecycle transition and SLA tracking",
      location: "Lab Test Room",
      serviceId: service.id,
      categoryId: category.id,
      userId: user.id,
      priority: "HIGH",
      status: "OPEN",
      responseDueAt,
      resolutionDueAt,
    },
  });

  assert.equal(ticket.status, "OPEN");
  assert.ok(ticket.ticketNumber.startsWith("INC-2026-"));

  // 3. Assign to staff -> ASSIGNED
  const assigned = await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      assignedStaffId: staff.id,
      status: "ASSIGNED",
    },
  });
  assert.equal(assigned.status, "ASSIGNED");
  assert.equal(assigned.assignedStaffId, staff.id);

  // 4. Staff starts work -> IN_PROGRESS
  const inProgress = await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: "IN_PROGRESS",
      respondedAt: new Date(),
    },
  });
  assert.equal(inProgress.status, "IN_PROGRESS");
  assert.ok(inProgress.respondedAt);

  // 5. Add comments: Public reply & Internal note
  const publicComment = await prisma.ticketComment.create({
    data: {
      ticketId: ticket.id,
      userId: staff.id,
      content: "Public reply to user: Investigating router settings.",
      isInternalNote: false,
    },
  });
  assert.equal(publicComment.isInternalNote, false);

  const internalComment = await prisma.ticketComment.create({
    data: {
      ticketId: ticket.id,
      userId: staff.id,
      content: "INTERNAL NOTE: Hardware replacement might be necessary.",
      isInternalNote: true,
    },
  });
  assert.equal(internalComment.isInternalNote, true);

  // 6. Resolve ticket -> RESOLVED
  const resolved = await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: "RESOLVED",
      resolutionNote: "Router rebooted and firmware upgraded.",
      resolvedAt: new Date(),
    },
  });
  assert.equal(resolved.status, "RESOLVED");
  assert.equal(resolved.resolutionNote, "Router rebooted and firmware upgraded.");

  // 7. User confirms resolution -> CLOSED
  const closed = await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
    },
  });
  assert.equal(closed.status, "CLOSED");
  assert.ok(closed.closedAt);

  // 8. Test Reopen flow
  const reopened = await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: "REOPENED",
      reopenReason: "WiFi dropped again 10 minutes later.",
      reopenedAt: new Date(),
    },
  });
  assert.equal(reopened.status, "REOPENED");
  assert.equal(reopened.reopenReason, "WiFi dropped again 10 minutes later.");

  // Clean up test ticket
  await prisma.ticketComment.deleteMany({ where: { ticketId: ticket.id } });
  await prisma.ticket.delete({ where: { id: ticket.id } });
});

