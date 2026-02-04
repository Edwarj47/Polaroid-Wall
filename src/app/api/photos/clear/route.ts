import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { canEditCollection, getCollectionAccess } from "@/lib/collectionAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const collectionId = body?.collectionId as string | undefined;

  if (!collectionId) {
    return NextResponse.json({ error: "Missing collectionId" }, { status: 400 });
  }

  const access = await getCollectionAccess(userId, collectionId);
  if (!canEditCollection(access.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("photos")
    .delete()
    .eq("collection_id", collectionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
