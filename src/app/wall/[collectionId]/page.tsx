import { redirect } from "next/navigation";

import PolaroidWallClient from "@/app/wall/components/PolaroidWallClient";
import WallToolbarClient from "@/app/wall/components/WallToolbarClient";
import { requireUserId } from "@/lib/auth";
import { canViewCollection, getCollectionAccess } from "@/lib/collectionAccess";
import { supabaseAdmin } from "@/lib/supabaseAdmin";


export default async function WallPage({
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
  if (!canViewCollection(access.role)) {
    redirect("/collections");
  }

  const { data: collection } = await supabaseAdmin
    .from("collections")
    .select("id, title, wall_title, wall_subtitle, wall_layout")
    .eq("id", collectionId)
    .single();

  if (!collection) {
    redirect("/collections");
  }

  const { data: photos } = await supabaseAdmin
    .from("photos")
    .select("id, base_url, note")
    .eq("collection_id", collection.id)
    .eq("is_hidden", false)
    .limit(80);

  return (
    <main className="min-h-screen bg-[#f4efe7] text-[#1f1c18]">
      <div className="pwo-toolbar">
        <div className="pwo-toolbar-title">{collection.title}</div>
        <div className="flex items-center gap-3">
          {access.role !== "viewer" && (
            <a className="pwo-toolbar-link" href={`/collections/${collection.id}/edit`}>
              Edit captions
            </a>
          )}
          <a className="pwo-toolbar-link" href="/collections">
            Collections
          </a>
          <a className="pwo-toolbar-link" href="/settings">
            Settings
          </a>
          <a className="pwo-toolbar-link" href="/api/auth/logout">
            Sign out
          </a>
          <WallToolbarClient collectionId={collection.id} canShare={access.role === "owner"} />
        </div>
      </div>
      <PolaroidWallClient
        collectionId={collection.id}
        photos={photos || []}
        title={collection.wall_title || collection.title}
        subtitle={collection.wall_subtitle || ""}
        initialLayout={collection.wall_layout || "curved"}
        showControls={access.role !== "viewer"}
        enableLayoutSave={access.role !== "viewer"}
      />
    </main>
  );
}
