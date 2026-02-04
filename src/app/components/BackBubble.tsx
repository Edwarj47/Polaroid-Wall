"use client";

import { usePathname, useRouter } from "next/navigation";

export default function BackBubble() {
  const pathname = usePathname();
  const router = useRouter();

  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/collections/") && pathname.endsWith("/edit")
  ) {
    return null;
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/collections");
  };

  return (
    <button
      className="pwo-back-bubble"
      type="button"
      aria-label="Go back"
      onClick={handleBack}
    >
      <span aria-hidden="true">←</span>
      <span className="pwo-back-label">Back</span>
    </button>
  );
}
