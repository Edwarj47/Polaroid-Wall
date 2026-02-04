import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { listAlbums } from "@/lib/googlePhotos";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const albums = await listAlbums(userId);

    if (albums.length) {
      const payload = albums.map((album) => ({
        user_id: userId,
        google_album_id: album.id,
        title: album.title,
      }));

      await supabaseAdmin.from("albums").upsert(payload, {
        onConflict: "user_id,google_album_id",
      });
    }

    return NextResponse.json({ albums });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch albums" }, { status: 500 });
  }
}
