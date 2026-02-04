import { redirect } from "next/navigation";

import EditPhotosClient from "@/app/collections/[collectionId]/edit/EditPhotosClient";
import { requireUserId } from "@/lib/auth";
import { canEditCollection, getCollectionAccess } from "@/lib/collectionAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const NOTE_LIMIT = 80;

export default async function EditCollectionPage({
  params,
}: {
  params: Promise<{ collectionId: string }>;
}) {
  const userId = await requireUserId();
  if (!userId) {
    redirect("/login");
  }

  const { collectionId } = await params;

  const access = await getCollectionAccess(userId, collectionId);
  if (!canEditCollection(access.role)) {
    redirect("/collections");
  }

  const { data: collection } = await supabaseAdmin
    .from("collections")
    .select("id, title, wall_title, wall_subtitle, user_id")
    .eq("id", collectionId)
    .single();

  if (!collection) {
    redirect("/collections");
  }

  const { data: photos } = await supabaseAdmin
    .from("photos")
    .select("id, base_url, note, is_hidden")
    .eq("collection_id", collection.id)
    .order("updated_at", { ascending: false });

  const { data: members } = await supabaseAdmin
    .from("collection_members")
    .select("id, email, role")
    .eq("collection_id", collection.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#f4efe7] text-[#1f1c18]">
      <div className="pwo-toolbar">
        <div className="pwo-toolbar-title">Edit captions</div>
        <div className="flex items-center gap-3">
          <a className="pwo-toolbar-link" href="/settings">
            Settings
          </a>
          <a className="pwo-toolbar-link" href="/api/auth/logout">
            Sign out
          </a>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Edit captions</h1>
          <p className="text-sm text-[#4a433c]">
            Add notes for {collection.title}. Limit {NOTE_LIMIT} characters.
          </p>
        </header>
        <EditPhotosClient
          photos={photos || []}
          noteLimit={NOTE_LIMIT}
          collectionId={collection.id}
          wallTitle={collection.wall_title || collection.title}
          wallSubtitle={collection.wall_subtitle || ""}
          members={members || []}
          canManageMembers={collection.user_id === userId}
        />
      </div>
    </main>
  );
}
