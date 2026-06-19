"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import type { VideoUnlockRow } from "@/lib/videoUnlock";
import { isClientRole, useProfileRole } from "@/hooks/useProfileRole";

export function useVideoUnlockSchedule() {
  const [unlockByVideoId, setUnlockByVideoId] = useState<Map<string, VideoUnlockRow>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const { role, loading: roleLoading } = useProfileRole();

  const loadUnlocks = useCallback(async () => {
    if (!isClientRole(role)) {
      setUnlockByVideoId(new Map());
      setLoading(false);
      return;
    }

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
  }, [role]);

  useEffect(() => {
    if (roleLoading) return;
    loadUnlocks();
  }, [loadUnlocks, roleLoading]);

  return { unlockByVideoId, loading: loading || roleLoading, refreshUnlocks: loadUnlocks };
}
