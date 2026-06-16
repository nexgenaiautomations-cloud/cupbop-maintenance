import { cookies } from "next/headers";
import { prisma } from "./db";
import type { Role } from "./types";

const SESSION_COOKIE = "cupbop_session";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  locationId: string | null;
  technicianId: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const c = await cookies();
  const userId = c.get(SESSION_COOKIE)?.value;
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    locationId: user.locationId,
    technicianId: user.technicianId,
  };
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

export async function loginByEmail(email: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) return null;
  await setSession(user.id);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    locationId: user.locationId,
    technicianId: user.technicianId,
  };
}

export function requireRole(user: SessionUser | null, ...allowed: Role[]): SessionUser {
  if (!user) throw new Error("Not authenticated");
  if (!allowed.includes(user.role)) throw new Error("Forbidden");
  return user;
}
