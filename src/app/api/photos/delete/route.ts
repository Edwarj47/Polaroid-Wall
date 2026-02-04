import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { canEditCollection } from "@/lib/collectionAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const photoId = body?.photoId as string | undefined;

  if (!photoId) {
    return NextResponse.json({ error: "Missing photoId" }, { status: 400 });
  }

  const { data: photo } = await supabaseAdmin
    .from("photos")
    .select("id, collection_id")
    .eq("id", photoId)
    .single();

  if (!photo?.collection_id) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const { data: collection } = await supabaseAdmin
    .from("collections")
    .select("id, user_id")
    .eq("id", photo.collection_id)
    .single();

  if (!collection) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  let canEdit = collection.user_id === userId;
  if (!canEdit) {
    const { data: member } = await supabaseAdmin
      .from("collection_members")
      .select("role")
      .eq("collection_id", collection.id)
      .eq("user_id", userId)
      .single();
    canEdit = canEditCollection((member?.role as "editor" | "viewer" | "owner") || null);
  }

  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("photos")
    .delete()
    .eq("id", photoId);

  if (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
