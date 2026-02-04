import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { canViewCollection, getCollectionAccess } from "@/lib/collectionAccess";
import { fetchTokenInfo } from "@/lib/googleAuth";
import { getValidAccessTokenForUser } from "@/lib/googlePicker";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const GOOGLE_PHOTOS_BASE = "https://photoslibrary.googleapis.com/v1";

const MIN_SIZE = 200;
const MAX_SIZE = 2000;
const DEFAULT_SIZE = 900;

function clampSize(value: number) {
  if (Number.isNaN(value)) {
    return DEFAULT_SIZE;
  }
  return Math.min(Math.max(value, MIN_SIZE), MAX_SIZE);
}

function buildImageUrl(baseUrl: string, size: number) {
  if (baseUrl.includes("/ppa/")) {
    return baseUrl;
  }
  return `${baseUrl}=w${size}-h${size}`;
}

function appendAccessToken(url: string, token: string) {
  const joiner = url.includes("?") ? "&" : "?";
  return `${url}${joiner}access_token=${encodeURIComponent(token)}`;
}

async function fetchFreshBaseUrl(accessToken: string, mediaItemId: string) {
  const response = await fetch(`${GOOGLE_PHOTOS_BASE}/mediaItems/${mediaItemId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    try {
      const tokenInfo = await fetchTokenInfo(accessToken);
      console.warn("mediaItems.get tokeninfo", {
        scopes: tokenInfo.scope || "",
        aud: tokenInfo.aud || "",
      });
    } catch (error) {
      console.warn("mediaItems.get tokeninfo failed", { error });
    }
    throw new Error(`Google Photos mediaItems.get failed: ${text}`);
  }

  const data = (await response.json()) as { baseUrl?: string };
  if (!data.baseUrl) {
    throw new Error("Google Photos mediaItems.get missing baseUrl");
  }

  return data.baseUrl;
}

async function fetchImageWithToken(imageUrl: string, accessToken: string) {
  return imageUrl.includes("/ppa/")
    ? fetch(appendAccessToken(imageUrl, accessToken))
    : fetch(imageUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const url = new URL(request.url);
  const shareToken = url.searchParams.get("token");
  const { photoId } = await params;

  let userId = await requireUserId();

  if (!userId && shareToken) {
    const { data: collection } = await supabaseAdmin
      .from("collections")
      .select("id, user_id")
      .eq("share_token", shareToken)
      .single();

    if (!collection) {
      console.warn("Share image request rejected: invalid token", { photoId });
      return NextResponse.json({ error: "Share link not found" }, { status: 404 });
    }

    const { data: photo } = await supabaseAdmin
      .from("photos")
      .select("id, base_url, user_id, google_media_item_id")
      .eq("id", photoId)
      .eq("collection_id", collection.id)
      .eq("is_hidden", false)
      .single();

    if (!photo) {
      console.warn("Share image request rejected: photo not found", { photoId });
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    const size = clampSize(Number(url.searchParams.get("size")));
    const accessToken = await getValidAccessTokenForUser(photo.user_id);
    let imageUrl = buildImageUrl(photo.base_url, size);

    let response = await fetchImageWithToken(imageUrl, accessToken);

    if (response.status === 403 && photo.google_media_item_id) {
      try {
        const freshBaseUrl = await fetchFreshBaseUrl(accessToken, photo.google_media_item_id);
        await supabaseAdmin
          .from("photos")
          .update({ base_url: freshBaseUrl })
          .eq("id", photo.id);
        imageUrl = buildImageUrl(freshBaseUrl, size);
        response = await fetchImageWithToken(imageUrl, accessToken);
      } catch (error) {
        console.warn("Share image refresh failed", { photoId, error });
      }
    }

    if (!response.ok) {
      const text = await response.text();
      console.warn("Share image fetch failed", {
        photoId,
        status: response.status,
        body: text,
      });
      return NextResponse.json(
        { error: `Failed to fetch image: ${text}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
      },
    });
  }

  if (!userId) {
    console.warn("Image request rejected: missing session", { photoId });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: photo } = await supabaseAdmin
    .from("photos")
    .select("id, base_url, collection_id, user_id, google_media_item_id")
    .eq("id", photoId)
    .single();

  if (!photo || !photo.collection_id) {
    console.warn("Image request rejected: photo not found", { photoId, userId });
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const access = await getCollectionAccess(userId, photo.collection_id);
  if (!canViewCollection(access.role)) {
    console.warn("Image request rejected: access denied", {
      photoId,
      userId,
      role: access.role,
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const size = clampSize(Number(url.searchParams.get("size")));
  const accessToken = await getValidAccessTokenForUser(photo.user_id);
  let imageUrl = buildImageUrl(photo.base_url, size);

  let response = await fetchImageWithToken(imageUrl, accessToken);

  if (response.status === 403 && photo.google_media_item_id) {
    try {
      const freshBaseUrl = await fetchFreshBaseUrl(accessToken, photo.google_media_item_id);
      await supabaseAdmin
        .from("photos")
        .update({ base_url: freshBaseUrl })
        .eq("id", photo.id);
      imageUrl = buildImageUrl(freshBaseUrl, size);
      response = await fetchImageWithToken(imageUrl, accessToken);
    } catch (error) {
      console.warn("Image refresh failed", { photoId, error });
    }
  }

  if (!response.ok) {
    const text = await response.text();
    console.warn("Image fetch failed", {
      photoId,
      status: response.status,
      body: text,
    });
    return NextResponse.json(
      { error: `Failed to fetch image: ${text}` },
      { status: response.status }
    );
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const buffer = await response.arrayBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300",
    },
  });
}
