import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type CollectionRole = "owner" | "editor" | "viewer" | null;

type AccessResult = {
  role: CollectionRole;
  collectionId: string | null;
  ownerId: string | null;
};

export async function getCollectionAccess(userId: string, collectionId: string): Promise<AccessResult> {
  const { data: collection } = await supabaseAdmin
    .from("collections")
    .select("id, user_id")
    .eq("id", collectionId)
    .single();

  if (!collection) {
    return { role: null, collectionId: null, ownerId: null };
  }

  if (collection.user_id === userId) {
    return { role: "owner", collectionId: collection.id, ownerId: collection.user_id };
  }

  const { data: member } = await supabaseAdmin
    .from("collection_members")
    .select("role")
    .eq("collection_id", collection.id)
    .eq("user_id", userId)
    .single();

  const role = (member?.role as CollectionRole) || null;

  return { role, collectionId: collection.id, ownerId: collection.user_id };
}

export function canEditCollection(role: CollectionRole) {
  return role === "owner" || role === "editor";
}

export function canViewCollection(role: CollectionRole) {
  return role === "owner" || role === "editor" || role === "viewer";
}
