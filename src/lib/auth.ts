import { supabase } from "@/integrations/supabase/client";
import { toE164Kenya } from "./onboarding";

export async function sendPhoneOtp(phone: string) {
  const e164 = toE164Kenya(phone);
  const { data, error } = await supabase.auth.signInWithOtp({ phone: e164 });
  return { data, error, e164 };
}

export async function verifyPhoneOtp(phone: string, token: string) {
  const e164 = toE164Kenya(phone);
  const { data, error } = await supabase.auth.verifyOtp({
    phone: e164,
    token,
    type: "sms",
  });
  return { data, error };
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email: email.trim(), password });
}

export async function fetchSignedInRole(): Promise<"member" | "provider" | "admin" | "hr" | null> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  const role = data?.role;
  if (role === "member" || role === "provider" || role === "admin" || role === "hr") return role;
  return null;
}

export async function fetchAdminSession(): Promise<{
  fullName: string;
  email: string | null;
  avatarUrl: string | null;
  roleLabel: string;
} | null> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url, role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data || data.role !== "admin") return null;
  const email = data.email ?? user.email ?? null;
  const metaName = user.user_metadata?.["full_name"];
  const fullName =
    data.full_name?.trim() ||
    (typeof metaName === "string" ? metaName : null) ||
    email?.split("@")[0] ||
    "Admin";
  return {
    fullName,
    email,
    avatarUrl: data.avatar_url,
    roleLabel: "Operations admin",
  };
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
  phone?: string,
  gender?: string,
) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: fullName,
        ...(phone ? { phone } : {}),
        ...(gender ? { gender } : {}),
      },
    },
  });
  if (error) return { data, error };
  if (!data.session) {
    return supabase.auth.signInWithPassword({ email: email.trim(), password });
  }
  return { data, error: null };
}

export async function sendEmailVerification(email: string) {
  return supabase.auth.resend({ type: "signup", email: email.trim() });
}

export async function sendPasswordReset(email: string) {
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/reset` : undefined;
  return supabase.auth.resetPasswordForEmail(email.trim(), redirectTo ? { redirectTo } : undefined);
}

export async function updatePassword(password: string) {
  return supabase.auth.updateUser({ password });
}

export async function upsertProfileMetadata(meta: Record<string, unknown>) {
  const { data: session } = await supabase.auth.getSession();
  const user = session.session?.user;
  if (!user) return { error: new Error("Not signed in") as Error | null };
  return supabase.auth.updateUser({ data: { ...user.user_metadata, ...meta } });
}
