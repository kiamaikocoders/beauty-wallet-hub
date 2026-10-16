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

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  return supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: fullName } },
  });
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
