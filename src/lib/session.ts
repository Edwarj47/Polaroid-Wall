import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "pwo_session";
const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7;

export function createSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_WEEK_SECONDS,
  });
}

export async function getSessionCookie() {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value || null;
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
