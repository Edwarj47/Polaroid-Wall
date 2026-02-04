import { getSessionCookie } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function requireUserId() {
  const token = await getSessionCookie();
  if (!token) {
    return null;
  }

  const nowIso = new Date().toISOString();
  const { data } = await supabaseAdmin
    .from("sessions")
    .select("user_id")
    .eq("session_token", token)
    .gt("expires_at", nowIso)
    .single();

  return data?.user_id || null;
}
