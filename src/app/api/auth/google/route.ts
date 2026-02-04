import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { buildGoogleAuthUrl } from "@/lib/googleAuth";

const STATE_COOKIE = "pwo_oauth_state";

export async function GET() {
  const state = crypto.randomUUID();
  const store = await cookies();
  store.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });
  const authUrl = buildGoogleAuthUrl(state);
  return NextResponse.redirect(authUrl);
}
