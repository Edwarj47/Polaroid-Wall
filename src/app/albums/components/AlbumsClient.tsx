"use client";

import { useEffect, useState } from "react";

type Album = {
  id: string;
  title: string;
};

type AlbumResponse = {
  albums: Album[];
};

export default function AlbumsClient() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/albums");
        if (!response.ok) {
          throw new Error("Failed to load albums");
        }
        const data = (await response.json()) as AlbumResponse;
        setAlbums(data.albums || []);
      } catch (err) {
        console.error(err);
        setError("Could not load albums. Check your connection.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSync = async (albumId: string) => {
    setSyncing(albumId);
    setError(null);
    try {
      const response = await fetch("/api/albums/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ albumId }),
      });

      if (!response.ok) {
        throw new Error("Sync failed");
      }

      await response.json();
      window.location.href = `/wall/${albumId}`;
    } catch (err) {
      console.error(err);
      setError("Could not sync album. Try again.");
    } finally {
      setSyncing(null);
    }
  };

  if (loading) {
    return <p className="text-base text-[#4a433c]">Loading albums...</p>;
  }

  if (!albums.length) {
    return <p className="text-base text-[#4a433c]">No albums found.</p>;
  }

  return (
    <div className="w-full space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ul className="space-y-3">
        {albums.map((album) => (
          <li
            key={album.id}
            className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 shadow-sm"
          >
            <span className="text-base font-medium text-[#1f1c18]">{album.title}</span>
            <button
              className="rounded-full bg-[#1f1c18] px-4 py-2 text-sm font-medium text-white hover:bg-[#3a322c] transition"
              onClick={() => handleSync(album.id)}
              disabled={syncing === album.id}
            >
              {syncing === album.id ? "Syncing..." : "Sync & Open"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
