"use client";

import { useEffect, useMemo, useState } from "react";

type Photo = {
  id: string;
  base_url: string;
  note: string | null;
};

type Props = {
  collectionId: string;
  photos: Photo[];
  title: string;
  subtitle: string;
  initialLayout: "curved" | "grid";
  showControls: boolean;
  enableLayoutSave: boolean;
  imageToken?: string | null;
};

const DISPLAY_COUNT = 14;
const REFRESH_MS = 60_000;
const LOAD_TIMEOUT_MS = 15_000;
const MIN_READY_COUNT = 10;

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickRandom<T>(items: T[], count: number) {
  return shuffle(items).slice(0, Math.min(count, items.length));
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function buildPositions(count: number, bounds: DOMRect, layout: string) {
  const cardWidth = 260;
  const cardHeight = 260;
  const gap = 26;
  const jitter = 8;
  const cols = Math.max(1, Math.floor((bounds.width - gap) / (cardWidth + gap)));
  const rows = Math.max(1, Math.floor((bounds.height - gap) / (cardHeight + gap)));
  const positions: { left: number; top: number }[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      let left = gap + col * (cardWidth + gap);
      let top = gap + row * (cardHeight + gap);

      if (layout === "curved") {
        const curve = Math.sin((col / Math.max(1, cols - 1)) * Math.PI) * 70;
        top += curve - row * 10;
        left += Math.sin((row / Math.max(1, rows - 1)) * Math.PI) * 26;
      }

      left += randomBetween(-jitter, jitter);
      top += randomBetween(-jitter, jitter);
      positions.push({ left, top });
    }
  }

  const safeZone =
    layout === "curved"
      ? {
          x: bounds.width * 0.2,
          y: bounds.height * 0.16,
          width: bounds.width * 0.6,
          height: 150,
        }
      : {
          x: bounds.width * 0.25,
          y: bounds.height * 0.4,
          width: bounds.width * 0.5,
          height: 120,
        };

  const filtered = positions.filter((pos) => {
    const centerX = pos.left + cardWidth / 2;
    const centerY = pos.top + cardHeight / 2;
    return !(
      centerX > safeZone.x &&
      centerX < safeZone.x + safeZone.width &&
      centerY > safeZone.y &&
      centerY < safeZone.y + safeZone.height
    );
  });

  const pool = filtered.length >= count ? filtered : positions;
  return shuffle(pool).slice(0, count);
}

export default function PolaroidWallClient({
  collectionId,
  photos,
  title,
  subtitle,
  initialLayout,
  showControls,
  enableLayoutSave,
  imageToken,
}: Props) {
  const [layout, setLayout] = useState(initialLayout);
  const [displayed, setDisplayed] = useState<Photo[]>([]);
  const [mounted, setMounted] = useState(false);
  const [imageStates, setImageStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return undefined;
    }

    const next = pickRandom(photos, DISPLAY_COUNT);
    setDisplayed(next);
    setImageStates(Object.fromEntries(next.map((photo) => [photo.id, false])));

    const interval = window.setInterval(() => {
      const shuffled = pickRandom(photos, DISPLAY_COUNT);
      setDisplayed(shuffled);
      setImageStates(Object.fromEntries(shuffled.map((photo) => [photo.id, false])));
    }, REFRESH_MS);

    return () => window.clearInterval(interval);
  }, [photos, mounted]);

  useEffect(() => {
    if (!mounted || !enableLayoutSave) {
      return;
    }

    const timeout = window.setTimeout(() => {
      fetch("/api/collections/layout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ collectionId, layout }),
      }).catch((error) => {
        console.error(error);
      });
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [collectionId, enableLayoutSave, layout, mounted]);

  const positions = useMemo(() => {
    if (!mounted || typeof window === "undefined") {
      return [] as { left: number; top: number }[];
    }
    const bounds = document.documentElement.getBoundingClientRect();
    return buildPositions(displayed.length, bounds, layout);
  }, [displayed.length, layout, mounted]);

  const markLoaded = (photoId: string) => {
    setImageStates((prev) => ({ ...prev, [photoId]: true }));
  };

  if (!mounted) {
    return (
      <div className="pwo-wall is-curved">
        <div className="pwo-title">{title}</div>
        <div className="pwo-subtitle">{subtitle}</div>
      </div>
    );
  }

  const imageParam = imageToken ? `&token=${encodeURIComponent(imageToken)}` : "";

  return (
    <div className={`pwo-wall ${layout === "curved" ? "is-curved" : ""}`}>
      {showControls && (
        <div className="pwo-controls">
          <button
            className={`pwo-button ${layout === "grid" ? "is-active" : ""}`}
            onClick={() => setLayout("grid")}
          >
            Grid wall
          </button>
          <button
            className={`pwo-button ${layout === "curved" ? "is-active" : ""}`}
            onClick={() => setLayout("curved")}
          >
            Curved wall
          </button>
        </div>
      )}
      <div className="pwo-title">{title}</div>
      <div className="pwo-subtitle">{subtitle}</div>
      <div className="pwo-layer is-ready">
        {displayed.map((photo, index) => {
          const position = positions[index] || { left: 0, top: 0 };
          const rotation = randomBetween(-6, 6);
          const scale = randomBetween(0.98, 1.02);
          return (
            <article
              className="pwo-polaroid"
              key={photo.id}
              style={{
                left: `${position.left}px`,
                top: `${position.top}px`,
                transform: `rotate(${rotation}deg) scale(${scale})`,
              }}
            >
              <div className={`pwo-photo-shell ${imageStates[photo.id] ? "is-loaded" : ""}`}>
                {!imageStates[photo.id] && <div className="pwo-spinner" aria-hidden="true" />}
                <img
                  src={`/api/photos/image/${photo.id}?size=700${imageParam}`}
                  alt={photo.note || "Memory"}
                  onLoad={() => markLoaded(photo.id)}
                  onError={() => markLoaded(photo.id)}
                />
              </div>
              {photo.note && <div className="pwo-caption">{photo.note}</div>}
            </article>
          );
        })}
      </div>
    </div>
  );
}
