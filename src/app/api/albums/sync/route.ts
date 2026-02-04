import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { listMediaItems } from "@/lib/googlePhotos";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const albumId = body?.albumId as string | undefined;

  if (!albumId) {
    return NextResponse.json({ error: "Missing albumId" }, { status: 400 });
  }

  try {
    const { data: albumRow, error: albumError } = await supabaseAdmin
      .from("albums")
      .select("id")
      .eq("user_id", userId)
      .eq("google_album_id", albumId)
      .single();

    if (albumError || !albumRow) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    const items = await listMediaItems(userId, albumId);

    if (items.length) {
      const payload = items.map((item) => ({
        user_id: userId,
        album_id: albumRow.id,
        google_media_item_id: item.id,
        base_url: item.baseUrl,
      }));

      await supabaseAdmin.from("photos").upsert(payload, {
        onConflict: "user_id,google_media_item_id",
      });
    }

    return NextResponse.json({ count: items.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to sync album" }, { status: 500 });
  }
}
