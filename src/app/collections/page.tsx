import { redirect } from "next/navigation";

import CollectionsClient from "@/app/collections/components/CollectionsClient";
import { requireUserId } from "@/lib/auth";

export default async function CollectionsPage() {
  const userId = await requireUserId();
  if (!userId) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#f4efe7] text-[#1f1c18]">
      <div className="pwo-toolbar">
        <div className="pwo-toolbar-title">Collections</div>
        <div className="flex items-center gap-3">
          <a className="pwo-toolbar-link" href="/settings">
            Settings
          </a>
          <a className="pwo-toolbar-link" href="/api/auth/logout">
            Sign out
          </a>
        </div>
      </div>
      <div className="w-full max-w-2xl mx-auto px-6 py-12 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Your collections</h1>
          <p className="text-base text-[#4a433c]">
            Create a collection, then pick photos to add. We never store the images, only notes.
          </p>
        </div>
        <CollectionsClient />
      </div>
    </main>
  );
}
