"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import type { VideoUnlockRow } from "@/lib/videoUnlock";

export function useVideoUnlockSchedule() {
  const [unlockByVideoId, setUnlockByVideoId] = useState<Map<string, VideoUnlockRow>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);

  const loadUnlocks = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUnlockByVideoId(new Map());
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("user_video_unlocks")
      .select("video_id, global_position, unlock_at, source")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error loading video unlock schedule:", error);
      setUnlockByVideoId(new Map());
    } else {
      const map = new Map<string, VideoUnlockRow>();
      (data ?? []).forEach((row) => {
        map.set(row.video_id, {
          video_id: row.video_id,
          global_position: row.global_position,
          unlock_at: row.unlock_at,
          source: row.source,
        });
      });
      setUnlockByVideoId(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUnlocks();
  }, [loadUnlocks]);

  return { unlockByVideoId, loading, refreshUnlocks: loadUnlocks };
}
