import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "itbantu_session";
const JWT_SECRET_STRING = process.env.JWT_SECRET || "itbantu-super-secret-jwt-key-2026-production-ready-64-bytes-entropy";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string; // USER, IT_STAFF, IT_SUPERVISOR, ADMIN
  departmentId?: string | null;
  itTeamId?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(user: AuthUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as string,
      departmentId: (payload.departmentId as string) || null,
      itTeamId: (payload.itTeamId as string) || null,
      phone: (payload.phone as string) || null,
      avatarUrl: (payload.avatarUrl as string) || null,
    };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(request: Request): Promise<AuthUser | null> {
  try {
    // 1. Check Authorization Bearer header
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const user = await verifyToken(token);
      if (user) return user;
    }

    // 2. Check Cookie header
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) return null;

    const cookiesList = cookieHeader.split(";").map((c) => c.trim());
    const sessionCookie = cookiesList.find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
    if (!sessionCookie) return null;

    const token = sessionCookie.substring(SESSION_COOKIE_NAME.length + 1);
    return await verifyToken(token);
  } catch {
    return null;
  }
}

