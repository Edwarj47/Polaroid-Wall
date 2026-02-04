import { refreshAccessToken } from "@/lib/googleAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const PICKER_BASE = "https://photospicker.googleapis.com/v1";

export type PickerSession = {
  id: string;
  pickerUri: string;
  mediaItemsSet?: boolean;
};

type MediaItem = {
  id: string;
  baseUrl: string;
};

type RawMediaItem = {
  id?: string;
  baseUrl?: string;
  mediaItemId?: string;
  mediaItem?: {
    id?: string;
    baseUrl?: string;
  };
  mediaFile?: {
    baseUrl?: string;
  };
};

export async function getValidAccessTokenForUser(userId: string) {
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
    throw new Error(`Google Picker API error: ${text}`);
  }

  return response.json();
}

export async function createPickerSession(userId: string) {
  const accessToken = await getValidAccessTokenForUser(userId);
  const data = await fetchWithAuth(`${PICKER_BASE}/sessions`, accessToken, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  const session = data as PickerSession;
  return {
    ...session,
    pickerUri: session.pickerUri ? `${session.pickerUri}/autoclose` : session.pickerUri,
  } as PickerSession;
}

export async function getPickerSession(userId: string, sessionId: string) {
  const accessToken = await getValidAccessTokenForUser(userId);
  const data = await fetchWithAuth(`${PICKER_BASE}/sessions/${sessionId}`, accessToken);
  return data as PickerSession;
}

type ListResult = {
  items: MediaItem[];
  notReady: boolean;
  rawCount: number;
  invalidCount: number;
  invalidSamples: RawMediaItem[];
};

function parsePickerError(text: string) {
  try {
    const parsed = JSON.parse(text) as { error?: { status?: string } };
    return parsed.error?.status || null;
  } catch {
    return null;
  }
}

export async function listPickedItems(userId: string, sessionId: string): Promise<ListResult> {
  const accessToken = await getValidAccessTokenForUser(userId);
  const items: MediaItem[] = [];
  const invalidSamples: RawMediaItem[] = [];
  let rawCount = 0;
  let invalidCount = 0;
  let pageToken = "";

  const normalizeItem = (item: RawMediaItem): MediaItem | null => {
    const id = item.mediaItemId ?? item.mediaItem?.id ?? item.id;
    const baseUrl = item.baseUrl ?? item.mediaItem?.baseUrl ?? item.mediaFile?.baseUrl;

    if (!id || !baseUrl) {
      return null;
    }

    return { id, baseUrl };
  };

  do {
    const url = new URL(`${PICKER_BASE}/mediaItems`);
    url.searchParams.set("sessionId", sessionId);
    url.searchParams.set("pageSize", "100");
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      if (parsePickerError(text) === "FAILED_PRECONDITION") {
        return { items: [], notReady: true, rawCount, invalidCount, invalidSamples };
      }
      throw new Error(`Google Picker API error: ${text}`);
    }

    const data = (await response.json()) as {
      mediaItems?: RawMediaItem[];
      nextPageToken?: string;
    };

    if (Array.isArray(data.mediaItems)) {
      rawCount += data.mediaItems.length;
      data.mediaItems.forEach((item) => {
        const normalized = normalizeItem(item);
        if (normalized) {
          items.push(normalized);
          return;
        }
        invalidCount += 1;
        if (invalidSamples.length < 3) {
          invalidSamples.push(item);
        }
      });
    }

    pageToken = data.nextPageToken || "";
  } while (pageToken);

  return { items, notReady: false, rawCount, invalidCount, invalidSamples };
}
