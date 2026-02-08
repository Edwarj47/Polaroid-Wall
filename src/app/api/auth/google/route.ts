import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { buildGoogleAuthUrl } from "@/lib/googleAuth";

const STATE_COOKIE = "pwo_oauth_state";

function mapConfigError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("google_client_id")) {
    return "missing_google_client_id";
  }

  if (message.includes("next_public_app_url")) {
    return "missing_next_public_app_url";
  }

  if (message.includes("google_redirect_uri")) {
    return "missing_google_redirect_uri";
  }

  if (message.includes("invalid url")) {
    return "invalid_next_public_app_url";
  }

  return "unknown";
}

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
    const reason = mapConfigError(error);
    console.error("Failed to build Google auth URL", error);
    return NextResponse.redirect(new URL(`/?error=config&reason=${reason}`, origin));
  }
}
