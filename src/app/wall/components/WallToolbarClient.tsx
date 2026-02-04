"use client";

import { useState } from "react";

type Props = {
  collectionId: string;
  canShare: boolean;
};

export default function WallToolbarClient({ collectionId, canShare }: Props) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/collections/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ collectionId }),
      });

      if (!response.ok) {
        throw new Error("Share link failed");
      }

      const data = (await response.json()) as { token: string };
      const url = `${window.location.origin}/share/${data.token}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
    } catch (err) {
      console.error(err);
      setError("Could not create share link.");
    } finally {
      setLoading(false);
    }
  };

  if (!canShare) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <button
        className="rounded-full border border-[#d8d0c7] px-4 py-2 text-xs font-medium text-[#1f1c18] hover:bg-[#f2ede7] transition"
        type="button"
        onClick={handleShare}
        disabled={loading}
      >
        {loading ? "Sharing..." : "Copy share link"}
      </button>
      {shareUrl && <span className="text-xs text-[#6b6157]">Link copied</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
