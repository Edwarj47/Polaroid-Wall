import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { canEditCollection, getCollectionAccess } from "@/lib/collectionAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const TITLE_LIMIT = 60;
const SUBTITLE_LIMIT = 80;

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const collectionId = body?.collectionId as string | undefined;
  const wallTitle = body?.wallTitle as string | undefined;
  const wallSubtitle = body?.wallSubtitle as string | undefined;

  if (!collectionId) {
    return NextResponse.json({ error: "Missing collectionId" }, { status: 400 });
  }

  const updatePayload: { wall_title?: string; wall_subtitle?: string } = {};

  if (typeof wallTitle === "string") {
    updatePayload.wall_title = wallTitle.slice(0, TITLE_LIMIT);
  }
  if (typeof wallSubtitle === "string") {
    updatePayload.wall_subtitle = wallSubtitle.slice(0, SUBTITLE_LIMIT);
  }

  if (!Object.keys(updatePayload).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const access = await getCollectionAccess(userId, collectionId);
  if (!canEditCollection(access.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("collections")
    .update(updatePayload)
    .eq("id", collectionId);

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, titleLimit: TITLE_LIMIT, subtitleLimit: SUBTITLE_LIMIT });
}
