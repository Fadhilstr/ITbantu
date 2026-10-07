import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode("itbantu-super-secret-jwt-key-2026-production-ready-64-bytes-entropy");

test("Authentication: Password hashing and verification", async () => {
  const plainPassword = "SecurePassword123!";
  const hash = await bcrypt.hash(plainPassword, 10);

  assert.notEqual(hash, plainPassword);
  assert.equal(await bcrypt.compare(plainPassword, hash), true);
  assert.equal(await bcrypt.compare("WrongPassword", hash), false);
});

test("Authentication: JWT token generation and verification", async () => {
  const payload = {
    id: "user-test-123",
    email: "test@itbantu.local",
    name: "Test User",
    role: "USER",
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  assert.ok(typeof token === "string" && token.length > 20);

  const verified = await jwtVerify(token, JWT_SECRET);
  assert.equal(verified.payload.id, payload.id);
  assert.equal(verified.payload.email, payload.email);
  assert.equal(verified.payload.role, payload.role);
});

