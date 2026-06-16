"use server";

import { redirect } from "next/navigation";
import { clearSession, loginByEmail } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const user = await loginByEmail(email);
  if (!user) {
    redirect(`/login?error=${encodeURIComponent("No account found for that email.")}`);
  }
  if (user.role === "ADMIN") redirect("/dashboard");
  if (user.role === "TECHNICIAN") redirect("/technician");
  redirect("/location");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
