import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getBunnyVideoMetadata } from "./actions";
import VideoManager from "./VideoManager";

export const dynamic = "force-dynamic";

type Course = {
  id: string;
  title: string;
  description: string | null;
};

type Chapter = {
  id: string;
  title: string;
  position: number;
  course_id: string;
};

export type AdminVideoRow = {
  id: string;
  title: string;
  chapter_id: string;
  position: number;
  deleted_at: string | null;
  bunny_video_id: string | null;
  requires_workbook: boolean;
  updated_at: string;
  duration_seconds: number | null;
  storage_size_bytes: number | null;
};

export default async function AdminVideos() {
  const supabase = getSupabaseAdminClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("id,title,description")
    .is("deleted_at", null)
    .order("title");

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id,title,position,course_id")
    .is("deleted_at", null)
    .order("position");

  const { data: videosRaw } = await supabase
    .from("videos")
    .select(
      "id,title,chapter_id,position,deleted_at,bunny_video_id,requires_workbook,updated_at,duration_seconds"
    )
    .is("deleted_at", null)
    .order("position");

  const videos: AdminVideoRow[] = await Promise.all(
    (videosRaw ?? []).map(async (v) => {
      let duration_seconds = v.duration_seconds ?? null;
      let storage_size_bytes: number | null = null;

      if (v.bunny_video_id) {
        try {
          const meta = await getBunnyVideoMetadata(v.bunny_video_id);
          if (meta.durationSeconds != null) duration_seconds = meta.durationSeconds;
          storage_size_bytes = meta.storageSizeBytes;
        } catch (e) {
          console.error("Bunny metadata for", v.bunny_video_id, e);
        }
      }

      return {
        ...v,
        duration_seconds,
        storage_size_bytes,
      };
    })
  );

  return (
    <VideoManager
      initialCourses={(courses ?? []) as Course[]}
      initialChapters={(chapters ?? []) as Chapter[]}
      initialVideos={videos}
    />
  );
}
