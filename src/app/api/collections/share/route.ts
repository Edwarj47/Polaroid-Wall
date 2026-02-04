import crypto from "crypto";
import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
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

  const { data: collection } = await supabaseAdmin
    .from("collections")
    .select("id, share_token")
    .eq("user_id", userId)
    .eq("id", collectionId)
    .single();

  if (!collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  let token = collection.share_token;
  if (!token) {
    token = crypto.randomUUID();
    const { error } = await supabaseAdmin
      .from("collections")
      .update({ share_token: token })
      .eq("id", collectionId);

    if (error) {
      return NextResponse.json({ error: "Failed to create share token" }, { status: 500 });
    }
  }

  return NextResponse.json({ token });
}
