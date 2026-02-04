import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { canEditCollection, getCollectionAccess } from "@/lib/collectionAccess";
import { createPickerSession, getPickerSession, listPickedItems } from "@/lib/googlePicker";
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

  const { data: collection } = await supabaseAdmin
    .from("collections")
    .select("id")
    .eq("id", collectionId)
    .single();

  if (!collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  try {
    const session = await createPickerSession(userId);

    await supabaseAdmin.from("picker_sessions").insert({
      user_id: userId,
      collection_id: collectionId,
      session_id: session.id,
    });

    return NextResponse.json({
      pickerUri: session.pickerUri,
      sessionId: session.id,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to start picker" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  const collectionId = url.searchParams.get("collectionId");

  if (!sessionId || !collectionId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const { data: sessionRow } = await supabaseAdmin
    .from("picker_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("collection_id", collectionId)
    .eq("session_id", sessionId)
    .single();

  if (!sessionRow) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  try {
    const session = await getPickerSession(userId, sessionId);

    const pollingConfig = (session as { pollingConfig?: { pollInterval?: string; timeoutIn?: string } })
      .pollingConfig;
    const mediaItemsSet = Boolean(session.mediaItemsSet);

    const { items, notReady, rawCount, invalidCount, invalidSamples } = await listPickedItems(
      userId,
      sessionId
    );

    if (notReady || (items.length === 0 && !mediaItemsSet)) {
      return NextResponse.json({
        completed: false,
        pollingConfig,
      });
    }

    if (rawCount > 0 && items.length === 0) {
      throw new Error(
        `Picker items missing baseUrl. rawCount=${rawCount} invalidCount=${invalidCount} samples=${JSON.stringify(
          invalidSamples
        )}`
      );
    }

    if (items.length) {
      const payload = items.map((item) => ({
        user_id: userId,
        collection_id: collectionId,
        google_media_item_id: item.id,
        base_url: item.baseUrl,
      }));

      const { error } = await supabaseAdmin.from("photos").upsert(payload, {
        onConflict: "user_id,google_media_item_id",
      });

      if (error) {
        throw new Error(`Supabase insert error: ${error.message}`);
      }
    }

    await supabaseAdmin.from("picker_sessions").delete().eq("id", sessionRow.id);

    return NextResponse.json({ completed: true, count: items.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to read picker session" }, { status: 500 });
  }
}
