import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
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

type Video = {
  id: string;
  title: string;
  chapter_id: string;
  position: number;
  deleted_at: string | null;
  bunny_video_id: string | null;
  requires_workbook: boolean;
  updated_at: string;
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

  const { data: videos } = await supabase
    .from("videos")
    .select("id,title,chapter_id,position,deleted_at,bunny_video_id,requires_workbook,updated_at")
    .is("deleted_at", null)
    .order("position");

  return (
    <VideoManager
      initialCourses={(courses ?? []) as Course[]}
      initialChapters={(chapters ?? []) as Chapter[]}
      initialVideos={(videos ?? []) as Video[]}
    />
  );
}
