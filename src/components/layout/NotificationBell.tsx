"use client";

import { useState } from "react";

export function NotificationBell() {
  const [toast, setToast] = useState(false);

  function handleClick() {
    setToast(true);
    window.setTimeout(() => setToast(false), 2500);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        aria-label="Benachrichtigungen"
        className="relative rounded-full border border-white/10 bg-white/[0.04] p-2.5 text-white/90 transition hover:border-[#63eca9]/40 hover:bg-white/[0.08]"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span
          className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#63eca9]"
          aria-hidden
        />
      </button>
      {toast && (
        <div
          role="status"
          className="absolute right-0 top-full z-50 mt-2 whitespace-nowrap rounded-lg border border-white/10 bg-black/90 px-3 py-2 text-xs text-white/80 shadow-lg backdrop-blur-md"
        >
          Benachrichtigungen — demnächst
        </div>
      )}
    </div>
  );
}
