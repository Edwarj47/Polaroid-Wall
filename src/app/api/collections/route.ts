import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: owned, error: ownedError } = await supabaseAdmin
    .from("collections")
    .select("id, title")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (ownedError) {
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }

  const { data: memberRows } = await supabaseAdmin
    .from("collection_members")
    .select("collection_id, role")
    .eq("user_id", userId);

  const memberIds = (memberRows || []).map((row) => row.collection_id).filter(Boolean);

  let memberCollections: { id: string; title: string; role: string }[] = [];
  if (memberIds.length) {
    const { data: members, error: memberError } = await supabaseAdmin
      .from("collections")
      .select("id, title")
      .in("id", memberIds)
      .order("created_at", { ascending: false });

    if (memberError) {
      return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
    }

    const roleByCollection = new Map(
      (memberRows || []).map((row) => [row.collection_id, row.role || "viewer"])
    );
    memberCollections = (members || []).map((item) => ({
      ...item,
      role: roleByCollection.get(item.id) || "viewer",
    }));
  }

  const merged = new Map<string, { id: string; title: string; role: string }>();
  (owned || []).forEach((item) => merged.set(item.id, { ...item, role: "owner" }));
  memberCollections.forEach((item) => merged.set(item.id, item));

  return NextResponse.json({ collections: Array.from(merged.values()) });
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const title = body?.title as string | undefined;
  if (!title) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("collections")
    .insert({
      user_id: userId,
      title,
    })
    .select("id, title")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
  }

  return NextResponse.json({ collection: data });
}
