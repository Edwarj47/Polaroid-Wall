import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const STATE_COOKIE = "pwo_oauth_state";

function mapConfigError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("google_client_id")) {
    return "missing_google_client_id";
  }

  if (message.includes("google_client_secret")) {
    return "missing_google_client_secret";
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

function resolveOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      console.warn("Invalid NEXT_PUBLIC_APP_URL; falling back to request origin");
    }
  }

  try {
    return new URL(request.url).origin;
  } catch {
    return "http://localhost:3000";
  }
}

export async function GET(request: Request) {
  const origin = resolveOrigin(request);

  try {
    const { buildGoogleAuthUrl } = await import("@/lib/googleAuth");
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
    const reason = mapConfigError(error);
    console.error("Failed to build Google auth URL", error);

    try {
      return NextResponse.redirect(new URL(`/?error=config&reason=${reason}`, origin));
    } catch {
      return NextResponse.json({ error: "config", reason }, { status: 500 });
    }
  }
}
