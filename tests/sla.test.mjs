import test from "node:test";
import assert from "node:assert/strict";

function getSlaStatus(dueAt, completedAt, createdAt = new Date()) {
  if (!dueAt) {
    return { state: "WITHIN_SLA", percentElapsed: 0, isBreached: false };
  }

  const dueDate = new Date(dueAt).getTime();
  const createdDate = new Date(createdAt).getTime();
  const totalWindow = Math.max(dueDate - createdDate, 1);

  if (completedAt) {
    const compDate = new Date(completedAt).getTime();
    const isBreached = compDate > dueDate;
    return {
      state: isBreached ? "BREACHED" : "MET",
      percentElapsed: 100,
      isBreached,
    };
  }

  const now = Date.now();
  const elapsed = Math.max(now - createdDate, 0);
  const percentElapsed = Math.min(Math.round((elapsed / totalWindow) * 100), 100);

  if (now > dueDate) {
    return { state: "BREACHED", percentElapsed: 100, isBreached: true };
  }

  if (percentElapsed >= 75) {
    return { state: "AT_RISK", percentElapsed, isBreached: false };
  }

  return { state: "WITHIN_SLA", percentElapsed, isBreached: false };
}

test("SLA: Calculation states", () => {
  const now = Date.now();

  // 1. Within SLA (due in 2 hours, created 10 mins ago)
  const dueFuture = new Date(now + 2 * 3600 * 1000);
  const createdRecent = new Date(now - 10 * 60 * 1000);
  const statusWithin = getSlaStatus(dueFuture, null, createdRecent);
  assert.equal(statusWithin.state, "WITHIN_SLA");
  assert.equal(statusWithin.isBreached, false);

  // 2. At Risk (elapsed 80% of window)
  const windowMs = 100 * 60 * 1000;
  const createdPast = new Date(now - 80 * 60 * 1000);
  const dueSoon = new Date(now + 20 * 60 * 1000);
  const statusAtRisk = getSlaStatus(dueSoon, null, createdPast);
  assert.equal(statusAtRisk.state, "AT_RISK");
  assert.equal(statusAtRisk.isBreached, false);

  // 3. Breached (due 30 mins ago)
  const duePast = new Date(now - 30 * 60 * 1000);
  const statusBreached = getSlaStatus(duePast, null, createdPast);
  assert.equal(statusBreached.state, "BREACHED");
  assert.equal(statusBreached.isBreached, true);

  // 4. Completed within SLA
  const resolvedOnTime = new Date(now - 40 * 60 * 1000);
  const statusMet = getSlaStatus(dueFuture, resolvedOnTime, createdPast);
  assert.equal(statusMet.state, "MET");
  assert.equal(statusMet.isBreached, false);
});

