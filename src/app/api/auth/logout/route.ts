import { NextResponse } from "next/server";

import { getSessionCookie, clearSessionCookie } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function handleLogout(request: Request) {
  const token = await getSessionCookie();
  if (token) {
    await supabaseAdmin.from("sessions").delete().eq("session_token", token);
  }

  await clearSessionCookie();
  return NextResponse.redirect(new URL("/", request.url));
}

export async function GET(request: Request) {
  return handleLogout(request);
}

export async function POST(request: Request) {
  return handleLogout(request);
}
