import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { exchangeCodeForTokens, fetchGoogleUserInfo, fetchTokenInfo } from "@/lib/googleAuth";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const STATE_COOKIE = "pwo_oauth_state";

function getAppOrigin(fallbackOrigin: string) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredUrl) {
    try {
      return new URL(configuredUrl).origin;
    } catch {
      console.warn("Invalid NEXT_PUBLIC_APP_URL; falling back to request origin");
    }
  }
  return fallbackOrigin;
}

export async function GET(request: Request) {
  let appOrigin = process.env.NEXT_PUBLIC_APP_URL || "";

  try {
    const url = new URL(request.url);
    appOrigin = getAppOrigin(url.origin);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      return NextResponse.redirect(new URL("/login?error=oauth", appOrigin));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL("/login?error=missing", appOrigin));
    }

    const store = await cookies();
    const expectedState = store.get(STATE_COOKIE)?.value;
    if (!expectedState || expectedState !== state) {
      return NextResponse.redirect(new URL("/login?error=state", appOrigin));
    }

    store.set(STATE_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    const tokens = await exchangeCodeForTokens(code);
    const tokenInfo = await fetchTokenInfo(tokens.access_token);
    const grantedScopes = new Set((tokenInfo.scope || "").split(" ").filter(Boolean));
    const requiredScopes = [
      "https://www.googleapis.com/auth/photospicker.mediaitems.readonly",
    ];
    const hasPhotosLibraryScope =
      grantedScopes.has("https://www.googleapis.com/auth/photoslibrary.readonly") ||
      grantedScopes.has("https://www.googleapis.com/auth/photoslibrary");
    const missingScopes = requiredScopes.filter((scope) => !grantedScopes.has(scope));

    console.info("OAuth scopes granted", {
      scopes: tokenInfo.scope || "",
      aud: tokenInfo.aud || "",
    });

    if (missingScopes.length || !hasPhotosLibraryScope) {
      const missing = [...missingScopes];
      if (!hasPhotosLibraryScope) {
        missing.push("photoslibrary.readonly OR photoslibrary");
      }
      console.error("OAuth scopes missing", {
        missingScopes: missing,
        scopes: tokenInfo.scope || "",
        aud: tokenInfo.aud || "",
      });
      throw new Error(`Missing required scopes: ${missing.join(", ")}`);
    }

    const userInfo = await fetchGoogleUserInfo(tokens.access_token);

    const { data: userRow, error: userError } = await supabaseAdmin
      .from("users")
      .upsert(
        {
          google_user_id: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name || null,
        },
        { onConflict: "google_user_id" }
      )
      .select("id, email")
      .single();

    if (userError || !userRow) {
      throw new Error(userError?.message || "User upsert failed");
    }

    await supabaseAdmin
      .from("collection_members")
      .update({ user_id: userRow.id })
      .ilike("email", userRow.email)
      .is("user_id", null);

    if (!tokens.refresh_token) {
      throw new Error("Missing refresh token; revoke access and re-consent.");
    }

    const refreshToken = tokens.refresh_token;

    await supabaseAdmin.from("auth_tokens").delete().eq("user_id", userRow.id);

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { error: tokenError } = await supabaseAdmin.from("auth_tokens").insert({
      user_id: userRow.id,
      access_token: tokens.access_token,
      refresh_token: refreshToken,
      expires_at: expiresAt,
    });

    if (tokenError) {
      throw new Error(tokenError.message);
    }

    await supabaseAdmin.from("sessions").delete().eq("user_id", userRow.id);

    const sessionToken = createSessionToken();
    const sessionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error: sessionError } = await supabaseAdmin.from("sessions").insert({
      user_id: userRow.id,
      session_token: sessionToken,
      expires_at: sessionExpires,
    });

    if (sessionError) {
      throw new Error(sessionError.message);
    }

    await setSessionCookie(sessionToken);

    return NextResponse.redirect(new URL("/collections", appOrigin));
  } catch (err) {
    const fallbackOrigin = getAppOrigin("http://localhost:3000");
    console.error("OAuth callback failed", err);
    return NextResponse.redirect(new URL("/login?error=failed", appOrigin || fallbackOrigin));
  }
}
