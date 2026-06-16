import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import type { Role } from "./types";

const SESSION_COOKIE = "cupbop_session";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: Role;
  locationId: string | null;
  technicianId: string | null;
};

function toSessionUser(u: {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: string;
  locationId: string | null;
  technicianId: string | null;
}): SessionUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    username: u.username,
    role: u.role as Role,
    locationId: u.locationId,
    technicianId: u.technicianId,
  };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const c = await cookies();
  const userId = c.get(SESSION_COOKIE)?.value;
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  return toSessionUser(user);
}

export async function setSession(userId: string) {
  const c = await cookies();
  c.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const c = await cookies();
  c.delete(SESSION_COOKIE);
}

/**
 * Sign in by email or username. If the user has a passwordHash, the password
 * is required and verified. Demo accounts without a passwordHash allow
 * passwordless sign-in.
 */
export async function login(
  identifier: string,
  password?: string
): Promise<{ user: SessionUser } | { error: "not_found" | "bad_password" | "password_required" }> {
  const id = identifier.trim().toLowerCase();
  if (!id) return { error: "not_found" };
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: id }, { username: id }] },
  });
  if (!user) return { error: "not_found" };

  if (user.passwordHash) {
    if (!password) return { error: "password_required" };
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return { error: "bad_password" };
  }

  await setSession(user.id);
  return { user: toSessionUser(user) };
}

export function requireRole(user: SessionUser | null, ...allowed: Role[]): SessionUser {
  if (!user) throw new Error("Not authenticated");
  if (!allowed.includes(user.role)) throw new Error("Forbidden");
  return user;
}

/**
 * Operators = combined admin + technician. Both roles share the same nav,
 * same broad access. Location managers are separate.
 */
export function isOperator(user: SessionUser | null): boolean {
  return user?.role === "ADMIN" || user?.role === "TECHNICIAN";
}
