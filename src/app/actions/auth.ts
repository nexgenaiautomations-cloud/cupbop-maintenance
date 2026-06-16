"use server";

import { redirect } from "next/navigation";
import { clearSession, login } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const identifier = String(formData.get("identifier") ?? formData.get("email") ?? "").trim();
  const password = formData.get("password") ? String(formData.get("password")) : undefined;

  const result = await login(identifier, password);
  if ("error" in result) {
    const messages: Record<string, string> = {
      not_found: "No account found for that email or username.",
      bad_password: "Incorrect password.",
      password_required: "Password required for this account.",
    };
    redirect(`/login?error=${encodeURIComponent(messages[result.error] ?? "Sign in failed.")}`);
  }
  const user = result.user;
  if (user.role === "LOCATION_MANAGER") redirect("/location");
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
