"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,40}$/;

async function requireOperator() {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  if (user.role === "LOCATION_MANAGER") throw new Error("Forbidden");
  return user;
}

const CreateTechnicianSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  username: z.string().regex(USERNAME_REGEX, "3–40 letters, numbers, dot, underscore, hyphen"),
  password: z.string().min(6).max(120),
});

export type CreateTechnicianResult =
  | { ok: true; username: string; password: string; loginUrl: string; email?: string }
  | { ok: false; error: string };

export async function createTechnicianAction(formData: FormData): Promise<CreateTechnicianResult> {
  await requireOperator();

  let parsed;
  try {
    parsed = CreateTechnicianSchema.parse({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      username: String(formData.get("username") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0].message : "Invalid input";
    return { ok: false, error: msg };
  }

  const username = parsed.username.toLowerCase();
  const email = parsed.email && parsed.email.length > 0
    ? parsed.email.toLowerCase()
    : `${username}@cupbopmaintenance.com`;

  const [byEmail, byUsername, byName] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { username } }),
    prisma.technician.findUnique({ where: { name: parsed.name } }),
  ]);
  if (byEmail) return { ok: false, error: "Email already in use" };
  if (byUsername) return { ok: false, error: "Username already taken" };
  if (byName) return { ok: false, error: "A technician with that name already exists" };

  const passwordHash = await bcrypt.hash(parsed.password, 10);

  const tech = await prisma.technician.create({
    data: {
      name: parsed.name,
      email: email,
      phone: parsed.phone || null,
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      name: parsed.name,
      email,
      username,
      passwordHash,
      role: "TECHNICIAN",
      technicianId: tech.id,
    },
  });

  revalidatePath("/technicians");
  revalidatePath("/settings");

  return {
    ok: true,
    username,
    password: parsed.password,
    email,
    loginUrl: "/login",
  };
}

const CreateLocationLoginSchema = z.object({
  locationId: z.string().min(1),
  name: z.string().min(2).max(80),
  email: z.string().email().optional().or(z.literal("")),
  username: z.string().regex(USERNAME_REGEX, "3–40 letters, numbers, dot, underscore, hyphen"),
  password: z.string().min(6).max(120),
});

export type CreateLocationLoginResult =
  | {
      ok: true;
      username: string;
      password: string;
      email: string;
      locationName: string;
    }
  | { ok: false; error: string };

export async function createLocationLoginAction(
  formData: FormData
): Promise<CreateLocationLoginResult> {
  await requireOperator();

  let parsed;
  try {
    parsed = CreateLocationLoginSchema.parse({
      locationId: String(formData.get("locationId") ?? ""),
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      username: String(formData.get("username") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0].message : "Invalid input";
    return { ok: false, error: msg };
  }

  const location = await prisma.location.findUnique({ where: { id: parsed.locationId } });
  if (!location) return { ok: false, error: "Location not found" };

  const username = parsed.username.toLowerCase();
  const email = parsed.email && parsed.email.length > 0
    ? parsed.email.toLowerCase()
    : `${username}@cupbopmaintenance.com`;

  const [byEmail, byUsername] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { username } }),
  ]);
  if (byEmail) return { ok: false, error: "Email already in use" };
  if (byUsername) return { ok: false, error: "Username already taken" };

  const passwordHash = await bcrypt.hash(parsed.password, 10);

  await prisma.user.create({
    data: {
      name: parsed.name,
      email,
      username,
      passwordHash,
      role: "LOCATION_MANAGER",
      locationId: location.id,
    },
  });

  // Also update the Location's manager contact info if it isn't set
  if (!location.managerEmail) {
    await prisma.location.update({
      where: { id: location.id },
      data: { managerName: parsed.name, managerEmail: email },
    });
  }

  revalidatePath(`/locations/${encodeURIComponent(location.name)}`);
  revalidatePath("/locations");

  return {
    ok: true,
    username,
    password: parsed.password,
    email,
    locationName: location.name,
  };
}
