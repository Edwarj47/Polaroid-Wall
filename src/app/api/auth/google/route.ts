import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { buildGoogleAuthUrl } from "@/lib/googleAuth";

const STATE_COOKIE = "pwo_oauth_state";

export async function GET() {
  try {
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
  } catch (error) {
    const origin = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
    console.error("Failed to build Google auth URL", error);
    return NextResponse.redirect(new URL("/?error=config", origin));
  }
}
