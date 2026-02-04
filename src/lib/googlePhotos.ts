import { refreshAccessToken } from "@/lib/googleAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const GOOGLE_PHOTOS_BASE = "https://photoslibrary.googleapis.com/v1";

type Album = {
  id: string;
  title: string;
};

type MediaItem = {
  id: string;
  baseUrl: string;
};

async function getValidAccessToken(userId: string) {
  const { data: tokenRow } = await supabaseAdmin
    .from("auth_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .single();

  if (!tokenRow) {
    throw new Error("Missing auth tokens");
  }

  const expiresAt = new Date(tokenRow.expires_at).getTime();
  const now = Date.now();

  if (expiresAt - now > 60_000) {
    return tokenRow.access_token;
  }

  const refreshed = await refreshAccessToken(tokenRow.refresh_token);
  const newAccessToken = refreshed.access_token;
  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

  await supabaseAdmin
    .from("auth_tokens")
    .update({ access_token: newAccessToken, expires_at: newExpiresAt })
    .eq("user_id", userId);

  return newAccessToken;
}

type TokenInfo = {
  aud?: string;
  azp?: string;
  scope?: string;
  issued_to?: string;
};

async function fetchTokenInfo(accessToken: string) {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`
  );
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as TokenInfo;
}

async function fetchWithAuth(url: string, accessToken: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options?.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    const tokenInfo = await fetchTokenInfo(accessToken);
    const scopeInfo = tokenInfo?.scope ? ` | scopes: ${tokenInfo.scope}` : "";
    const audInfo = tokenInfo?.aud || tokenInfo?.issued_to;
    const azpInfo = tokenInfo?.azp;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientMatch = audInfo && clientId ? audInfo === clientId : null;
    const audDetails = audInfo ? ` | aud: ${audInfo}` : "";
    const azpDetails = azpInfo ? ` | azp: ${azpInfo}` : "";
    const matchDetails = clientMatch === null ? "" : ` | aud_matches_client: ${clientMatch}`;
    throw new Error(
      `Google Photos API error: ${text}${scopeInfo}${audDetails}${azpDetails}${matchDetails}`
    );
  }

  return response.json();
}

export async function listAlbums(userId: string) {
  const accessToken = await getValidAccessToken(userId);
  const albums: Album[] = [];
  let pageToken = "";

  do {
    const url = new URL(`${GOOGLE_PHOTOS_BASE}/albums`);
    url.searchParams.set("pageSize", "50");
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const data = await fetchWithAuth(url.toString(), accessToken);
    if (Array.isArray(data.albums)) {
      albums.push(...data.albums.map((album: Album) => ({ id: album.id, title: album.title })));
    }
    pageToken = data.nextPageToken || "";
  } while (pageToken);

  return albums;
}

export async function listMediaItems(userId: string, albumId: string) {
  const accessToken = await getValidAccessToken(userId);
  const items: MediaItem[] = [];
  let pageToken = "";

  do {
    const response = await fetchWithAuth(`${GOOGLE_PHOTOS_BASE}/mediaItems:search`, accessToken, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        albumId,
        pageSize: 100,
        pageToken: pageToken || undefined,
      }),
    });

    if (Array.isArray(response.mediaItems)) {
      items.push(
        ...response.mediaItems.map((item: MediaItem) => ({
          id: item.id,
          baseUrl: item.baseUrl,
        }))
      );
    }

    pageToken = response.nextPageToken || "";
  } while (pageToken);

  return items;
}
