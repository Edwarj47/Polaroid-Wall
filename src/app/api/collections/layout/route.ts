import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { canEditCollection, getCollectionAccess } from "@/lib/collectionAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const VALID_LAYOUTS = new Set(["curved", "grid"]);

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const collectionId = body?.collectionId as string | undefined;
  const layout = body?.layout as string | undefined;

  if (!collectionId || !layout || !VALID_LAYOUTS.has(layout)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const access = await getCollectionAccess(userId, collectionId);
  if (!canEditCollection(access.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("collections")
    .update({ wall_layout: layout })
    .eq("id", collectionId);

  if (error) {
    return NextResponse.json({ error: "Failed to update layout" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
