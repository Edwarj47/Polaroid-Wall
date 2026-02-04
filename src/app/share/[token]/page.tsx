import { notFound } from "next/navigation";

import PolaroidWallClient from "@/app/wall/components/PolaroidWallClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function ShareWallPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const { data: collection } = await supabaseAdmin
    .from("collections")
    .select("id, title, wall_title, wall_subtitle, share_token, wall_layout")
    .eq("share_token", token)
    .single();

  if (!collection) {
    notFound();
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
          <a className="pwo-toolbar-link" href="/settings">
            Settings
          </a>
          <a className="pwo-toolbar-link" href="/api/auth/logout">
            Sign out
          </a>
        </div>
      </div>
      <PolaroidWallClient
        collectionId={collection.id}
        photos={photos || []}
        title={collection.wall_title || collection.title}
        subtitle={collection.wall_subtitle || ""}
        initialLayout={collection.wall_layout || "curved"}
        showControls={false}
        enableLayoutSave={false}
        imageToken={collection.share_token}
      />
    </main>
  );
}
