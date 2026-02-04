"use client";

import { useEffect, useState } from "react";

type Collection = {
  id: string;
  title: string;
  role: string;
};

type CollectionsResponse = {
  collections: Collection[];
};

type PickerResponse = {
  pickerUri: string;
  sessionId: string;
};

export default function CollectionsClient() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");

  const loadCollections = async () => {
    try {
      const response = await fetch("/api/collections");
      if (!response.ok) {
        throw new Error("Failed to load collections");
      }
      const data = (await response.json()) as CollectionsResponse;
      setCollections(data.collections || []);
    } catch (err) {
      console.error(err);
      setError("Could not load collections. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) {
      setError("Give your collection a name.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (!response.ok) {
        throw new Error("Failed to create");
      }
      setTitle("");
      await loadCollections();
    } catch (err) {
      console.error(err);
      setError("Could not create collection.");
    } finally {
      setCreating(false);
    }
  };

  const handlePick = async (collectionId: string) => {
    setSyncing(collectionId);
    setError(null);
    try {
      const response = await fetch("/api/picker/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ collectionId }),
      });

      if (!response.ok) {
        throw new Error("Picker start failed");
      }

      const data = (await response.json()) as PickerResponse;
      const pickerWindow = window.open(data.pickerUri, "picker", "width=960,height=720");
      const deadline = Date.now() + 10 * 60 * 1000;

      const poll = async () => {
        if (Date.now() > deadline) {
          setError("Picker timed out. Try again.");
          return;
        }

        try {
          const statusResponse = await fetch(
            `/api/picker/session?sessionId=${data.sessionId}&collectionId=${collectionId}`
          );
          if (!statusResponse.ok) {
            window.setTimeout(poll, 3000);
            return;
          }
          const status = await statusResponse.json();
          if (status.completed) {
            if (pickerWindow && !pickerWindow.closed) {
              pickerWindow.close();
            }
            window.location.href = `/wall/${collectionId}`;
            return;
          }

          const pollInterval = status.pollingConfig?.pollInterval
            ? parseInt(status.pollingConfig.pollInterval, 10) * 1000
            : 2500;
          window.setTimeout(poll, pollInterval);
        } catch (err) {
          console.error(err);
          window.setTimeout(poll, 3000);
        }
      };

      window.setTimeout(poll, 2500);
    } catch (err) {
      console.error(err);
      setError("Could not start picker. Try again.");
    } finally {
      setSyncing(null);
    }
  };

  if (loading) {
    return <p className="text-base text-[#4a433c]">Loading collections...</p>;
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-col gap-3 rounded-2xl bg-white px-4 py-4 shadow-sm sm:flex-row">
        <input
          className="flex-1 rounded-xl border border-[#e4dfd8] px-4 py-2 text-sm"
          placeholder="Create a collection (e.g., Valentine's 2026)"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <button
          className="rounded-full bg-[#1f1c18] px-4 py-2 text-sm font-medium text-white hover:bg-[#3a322c] transition"
          onClick={handleCreate}
          disabled={creating}
        >
          {creating ? "Creating..." : "Create"}
        </button>
      </div>
      <ul className="space-y-3">
        {collections.map((collection) => (
          <li
            key={collection.id}
            className="flex flex-col gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="text-base font-medium text-[#1f1c18]">{collection.title}</span>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-full border border-[#d8d0c7] px-4 py-2 text-sm font-medium text-[#1f1c18] hover:bg-[#f2ede7] transition"
                onClick={() => (window.location.href = `/wall/${collection.id}`)}
              >
                Open wall
              </button>
              {collection.role !== "viewer" && (
                <button
                  className="rounded-full bg-[#1f1c18] px-4 py-2 text-sm font-medium text-white hover:bg-[#3a322c] transition"
                  onClick={() => handlePick(collection.id)}
                  disabled={syncing === collection.id}
                >
                  {syncing === collection.id ? "Waiting..." : "Add photos"}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
