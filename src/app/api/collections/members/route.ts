import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { getCollectionAccess } from "@/lib/collectionAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ALLOWED_ROLES = new Set(["viewer", "editor"]);

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const collectionId = body?.collectionId as string | undefined;
  const email = body?.email as string | undefined;
  const role = body?.role as string | undefined;

  if (!collectionId || !email || !role || !ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const access = await getCollectionAccess(userId, collectionId);
  if (access.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: existingUser } = await supabaseAdmin
    .from("users")
    .select("id, email")
    .ilike("email", email)
    .single();

  const { data: member, error } = await supabaseAdmin
    .from("collection_members")
    .upsert(
      {
        collection_id: collectionId,
        email,
        role,
        user_id: existingUser?.id || null,
      },
      { onConflict: "collection_id,email" }
    )
    .select("id, email, role")
    .single();

  if (error || !member) {
    return NextResponse.json({ error: "Failed to invite" }, { status: 500 });
  }

  return NextResponse.json({ member });
}

export async function DELETE(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const collectionId = body?.collectionId as string | undefined;
  const memberId = body?.memberId as string | undefined;

  if (!collectionId || !memberId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const access = await getCollectionAccess(userId, collectionId);
  if (access.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("collection_members")
    .delete()
    .eq("id", memberId)
    .eq("collection_id", collectionId);

  if (error) {
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
