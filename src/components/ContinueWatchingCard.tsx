"use client";

import React from "react";
import Link from "next/link";

type Props = {
  nextVideoId?: string;
  nextVideoTitle?: string;
};

const ContinueWatchingCard: React.FC<Props> = ({ nextVideoId, nextVideoTitle }) => {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Weiter ansehen</h3>
          <p className="text-white/60 text-sm mt-1">
            {nextVideoTitle ? nextVideoTitle : "Du hast noch kein Video begonnen."}
          </p>
        </div>
        {nextVideoId ? (
          <Link href={`/video/${nextVideoId}`} className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/[0.08] transition">
            Fortsetzen
          </Link>
        ) : null}
      </div>
    </div>
  );
};

export default ContinueWatchingCard;


