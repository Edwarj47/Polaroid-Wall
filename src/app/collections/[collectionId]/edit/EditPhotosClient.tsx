"use client";

import { useState } from "react";

type Photo = {
  id: string;
  base_url: string;
  note: string | null;
  is_hidden: boolean;
};

type Member = {
  id: string;
  email: string;
  role: string;
};

type Props = {
  photos: Photo[];
  noteLimit: number;
  collectionId: string;
  wallTitle: string;
  wallSubtitle: string;
  members: Member[];
  canManageMembers: boolean;
};

const TITLE_LIMIT = 60;
const SUBTITLE_LIMIT = 80;

export default function EditPhotosClient({
  photos,
  noteLimit,
  collectionId,
  wallTitle,
  wallSubtitle,
  members,
  canManageMembers,
}: Props) {
  const [items, setItems] = useState<Photo[]>(photos);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [imageStates, setImageStates] = useState<Record<string, boolean>>({});
  const [title, setTitle] = useState(wallTitle);
  const [subtitle, setSubtitle] = useState(wallSubtitle);
  const [savingText, setSavingText] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [currentMembers, setCurrentMembers] = useState<Member[]>(members);
  const [clearingAll, setClearingAll] = useState(false);

  const updatePhoto = async (photoId: string, payload: { note?: string; isHidden?: boolean }) => {
    setSavingId(photoId);
    try {
      const response = await fetch("/api/photos/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ photoId, ...payload }),
      });
      if (!response.ok) {
        throw new Error("Update failed");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingId(null);
    }
  };

  const markLoaded = (photoId: string) => {
    setImageStates((prev) => ({ ...prev, [photoId]: true }));
  };

  const handleNoteChange = (photoId: string, note: string) => {
    setInviteError(null);
    setInviteStatus(null);
    setItems((prev) =>
      prev.map((photo) => (photo.id === photoId ? { ...photo, note } : photo))
    );
  };

  const handleBlur = (photoId: string, note: string | null) => {
    updatePhoto(photoId, { note: note || "" });
  };

  const updateCollectionText = async () => {
    setSavingText(true);
    try {
      const response = await fetch("/api/collections/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collectionId,
          wallTitle: title,
          wallSubtitle: subtitle,
        }),
      });
      if (!response.ok) {
        throw new Error("Collection update failed");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingText(false);
    }
  };

  const handleToggleHidden = (photoId: string) => {
    setSyncError(null);
    setItems((prev) =>
      prev.map((photo) =>
        photo.id === photoId ? { ...photo, is_hidden: !photo.is_hidden } : photo
      )
    );

    const updated = items.find((photo) => photo.id === photoId);
    updatePhoto(photoId, { isHidden: updated ? !updated.is_hidden : true });
  };

  const handleAddPhotos = async () => {
    setInviteError(null);
    setInviteStatus(null);
    setSyncing(true);
    setSyncError(null);

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

      const data = (await response.json()) as { pickerUri: string; sessionId: string };
      const pickerWindow = window.open(data.pickerUri, "picker", "width=960,height=720");
      const deadline = Date.now() + 10 * 60 * 1000;

      const poll = async () => {
        if (Date.now() > deadline) {
          setSyncError("Picker timed out. Try again.");
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
            window.location.reload();
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
    } catch (error) {
      console.error(error);
      setSyncError("Could not start picker. Try again.");
    } finally {
      setSyncing(false);
    }
  };

  const handleInvite = async () => {
    if (!canManageMembers) {
      return;
    }

    if (!inviteEmail.trim()) {
      setInviteError("Enter an email address.");
      return;
    }

    setInviteError(null);
    setInviteStatus(null);

    try {
      const response = await fetch("/api/collections/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collectionId,
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      if (!response.ok) {
        throw new Error("Invite failed");
      }

      const data = (await response.json()) as { member: Member };
      const normalizedEmail = data.member.email.toLowerCase();
      setCurrentMembers((prev) => {
        const filtered = prev.filter(
          (member) =>
            member.id !== data.member.id && member.email.toLowerCase() !== normalizedEmail
        );
        return [data.member, ...filtered];
      });
      setInviteEmail("");
      setInviteRole("viewer");
      setInviteStatus("Invite sent.");
    } catch (error) {
      console.error(error);
      setInviteError("Could not invite collaborator.");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    setInviteError(null);
    setInviteStatus(null);

    try {
      const response = await fetch("/api/collections/members", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ collectionId, memberId }),
      });

      if (!response.ok) {
        throw new Error("Remove failed");
      }

      setCurrentMembers((prev) => prev.filter((member) => member.id !== memberId));
      setInviteStatus("Collaborator removed.");
    } catch (error) {
      console.error(error);
      setInviteError("Could not remove collaborator.");
    }
  };

  const handleRemovePhoto = async (photoId: string) => {
    setSavingId(photoId);
    try {
      const response = await fetch("/api/photos/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ photoId }),
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setItems((prev) => prev.filter((photo) => photo.id !== photoId));
    } catch (error) {
      console.error(error);
    } finally {
      setSavingId(null);
    }
  };

  const handleClearAllPhotos = async () => {
    setInviteError(null);
    setInviteStatus(null);
    setSyncError(null);

    if (items.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      "Remove all photos from this collection? This cannot be undone."
    );
    if (!confirmed) {
      return;
    }

    setClearingAll(true);
    try {
      const response = await fetch("/api/photos/clear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ collectionId }),
      });

      if (!response.ok) {
        throw new Error("Clear failed");
      }

      setItems([]);
      setInviteStatus("All photos removed.");
    } catch (error) {
      console.error(error);
      setSyncError("Could not remove all photos. Try again.");
    } finally {
      setClearingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-4 shadow space-y-3">
        <div className="text-sm font-medium text-[#1f1c18]">Wall text</div>
        <input
          className="w-full rounded-xl border border-[#e4dfd8] px-4 py-2 text-sm"
          value={title}
          maxLength={TITLE_LIMIT}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={updateCollectionText}
          placeholder="Wall title"
        />
        <div className="flex items-center justify-between text-xs text-[#6b6157]">
          <span>{title.length}/{TITLE_LIMIT}</span>
          {savingText && <span>Saving...</span>}
        </div>
        <input
          className="w-full rounded-xl border border-[#e4dfd8] px-4 py-2 text-sm"
          value={subtitle}
          maxLength={SUBTITLE_LIMIT}
          onChange={(event) => setSubtitle(event.target.value)}
          onBlur={updateCollectionText}
          placeholder="Wall subtitle"
        />
        <div className="flex items-center justify-between text-xs text-[#6b6157]">
          <span>{subtitle.length}/{SUBTITLE_LIMIT}</span>
          {savingText && <span>Saving...</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            className="rounded-full border border-[#d8d0c7] px-4 py-2 text-xs font-medium text-[#1f1c18] hover:bg-[#f2ede7] transition"
            href={`/wall/${collectionId}`}
          >
            Return to wall
          </a>
          <a
            className="rounded-full border border-[#d8d0c7] px-4 py-2 text-xs font-medium text-[#1f1c18] hover:bg-[#f2ede7] transition"
            href="/collections"
          >
            Return to collections
          </a>
          <button
            className="rounded-full bg-[#1f1c18] px-4 py-2 text-xs font-medium text-white hover:bg-[#3a322c] transition"
            type="button"
            onClick={handleAddPhotos}
            disabled={syncing}
          >
            {syncing ? "Adding..." : "Add photos"}
          </button>
          <button
            className="rounded-full border border-[#d8b7a6] px-4 py-2 text-xs font-medium text-[#7a1f1f] hover:bg-[#f5e9e1] transition"
            type="button"
            onClick={handleClearAllPhotos}
            disabled={clearingAll || items.length === 0}
          >
            {clearingAll ? "Removing..." : "Remove all photos"}
          </button>
        </div>
        {syncError && <p className="text-xs text-red-600">{syncError}</p>}
      </div>

      {canManageMembers && (
        <div className="rounded-2xl bg-white p-4 shadow space-y-3">
          <div className="text-sm font-medium text-[#1f1c18]">Collaborators</div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              className="flex-1 rounded-xl border border-[#e4dfd8] px-4 py-2 text-sm"
              placeholder="Invite by email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
            />
            <select
              className="rounded-xl border border-[#e4dfd8] px-3 py-2 text-sm"
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value)}
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
            <button
              className="rounded-full bg-[#1f1c18] px-4 py-2 text-xs font-medium text-white hover:bg-[#3a322c] transition"
              type="button"
              onClick={handleInvite}
            >
              Invite
            </button>
          </div>
          {inviteStatus && <p className="text-xs text-[#6b6157]">{inviteStatus}</p>}
          {inviteError && <p className="text-xs text-red-600">{inviteError}</p>}
          {currentMembers.length > 0 && (
            <div className="space-y-2">
              {currentMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#ece6df] px-3 py-2 text-xs"
                >
                  <span>{member.email}</span>
                  <div className="flex items-center gap-2">
                    <span className="uppercase text-[#6b6157]">{member.role}</span>
                    <button
                      className="rounded-full border border-[#d8d0c7] px-2 py-1 text-[11px] font-medium text-[#1f1c18] hover:bg-[#f2ede7] transition"
                      type="button"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((photo) => (
          <div key={photo.id} className="rounded-2xl bg-white p-3 shadow space-y-3">
            <div className={`pwo-photo-shell ${imageStates[photo.id] ? "is-loaded" : ""}`}>
              {!imageStates[photo.id] && <div className="pwo-spinner" aria-hidden="true" />}
              <img
                src={`/api/photos/image/${photo.id}?size=700`}
                alt={photo.note || "Memory"}
                onLoad={() => markLoaded(photo.id)}
                onError={() => markLoaded(photo.id)}
                className={`h-48 w-full rounded-xl object-cover ${
                  photo.is_hidden ? "opacity-50" : "opacity-100"
                }`}
              />
            </div>
            <textarea
              className="w-full rounded-xl border border-[#e4dfd8] px-3 py-2 text-sm"
              placeholder="Add a note..."
              value={photo.note || ""}
              maxLength={noteLimit}
              onChange={(event) => handleNoteChange(photo.id, event.target.value)}
              onBlur={(event) => handleBlur(photo.id, event.target.value)}
              rows={3}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6b6157]">
              <span>{(photo.note || "").length}/{noteLimit}</span>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-full border border-[#d8d0c7] px-3 py-1 text-xs font-medium text-[#1f1c18] hover:bg-[#f2ede7] transition"
                  onClick={() => handleToggleHidden(photo.id)}
                >
                  {photo.is_hidden ? "Show" : "Hide"}
                </button>
                <button
                  className="rounded-full border border-[#d8d0c7] px-3 py-1 text-xs font-medium text-[#1f1c18] hover:bg-[#f2ede7] transition"
                  onClick={() => handleRemovePhoto(photo.id)}
                >
                  Remove
                </button>
              </div>
            </div>
            {savingId === photo.id && (
              <p className="text-xs text-[#9b938a]">Saving...</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
