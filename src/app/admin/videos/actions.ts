"use server";

import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";
import { createBunnyVideo, deleteBunnyVideo } from "@/lib/bunnyCDN";

// Helper to check admin access
async function checkAdminAccess() {
  const user = await getAuthUserFromCookie();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = getSupabaseAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const emailWhitelisted = ["info@oag-media.com"].includes(user.email);
  const isAdmin = (profile?.role === "admin") || emailWhitelisted;

  if (!isAdmin) {
    throw new Error("Unauthorized");
  }

  return { user, supabase };
}

// Generate slug from title
function generateSlug(title: string, videoIdSuffix: string = ""): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return videoIdSuffix ? `${slug}-${videoIdSuffix}` : slug;
}

// Course actions
export async function createCourse(title: string, description: string) {
  await checkAdminAccess();
  const supabase = getSupabaseAdminClient();
  
  const slug = generateSlug(title);
  
  const { data, error } = await supabase
    .from("courses")
    .insert({
      title,
      description,
      slug,
      published: true,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/admin/videos");
  return data;
}

export async function updateCourse(id: string, title: string, description: string) {
  await checkAdminAccess();
  const supabase = getSupabaseAdminClient();
  
  const slug = generateSlug(title);
  
  const { data, error } = await supabase
    .from("courses")
    .update({ title, description, slug, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/admin/videos");
  return data;
}

export async function deleteCourse(id: string) {
  await checkAdminAccess();
  const supabase = getSupabaseAdminClient();
  
  const { error } = await supabase
    .from("courses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin/videos");
}

// Chapter actions
export async function createChapter(courseId: string, title: string) {
  await checkAdminAccess();
  const supabase = getSupabaseAdminClient();
  
  // Get max position for this course
  const { data: chapters } = await supabase
    .from("chapters")
    .select("position")
    .eq("course_id", courseId)
    .is("deleted_at", null)
    .order("position", { ascending: false })
    .limit(1);

  const position = chapters && chapters.length > 0 ? chapters[0].position + 1 : 1;

  const { data, error } = await supabase
    .from("chapters")
    .insert({
      course_id: courseId,
      title,
      position,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/admin/videos");
  return data;
}

export async function updateChapter(id: string, title: string) {
  await checkAdminAccess();
  const supabase = getSupabaseAdminClient();
  
  const { data, error } = await supabase
    .from("chapters")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/admin/videos");
  return data;
}

export async function deleteChapter(id: string) {
  await checkAdminAccess();
  const supabase = getSupabaseAdminClient();
  
  const { error } = await supabase
    .from("chapters")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin/videos");
}

// Video actions
/**
 * Create a Bunny video and return the video ID for client-side upload
 * The client will handle the actual file upload
 */
export async function createBunnyVideoForUpload(title: string): Promise<{ bunnyVideoId: string }> {
  await checkAdminAccess();
  
  // Create Bunny video
  const bunnyVideo = await createBunnyVideo(title);
  const bunnyVideoId = bunnyVideo.guid;

  return { bunnyVideoId };
}

/**
 * Create video record after upload is complete
 */
export async function createVideoRecord(
  chapterId: string,
  title: string,
  bunnyVideoId: string
): Promise<{ videoId: string }> {
  await checkAdminAccess();
  const supabase = getSupabaseAdminClient();
  
  // Get max position for this chapter
  const { data: videos } = await supabase
    .from("videos")
    .select("position")
    .eq("chapter_id", chapterId)
    .is("deleted_at", null)
    .order("position", { ascending: false })
    .limit(1);

  const position = videos && videos.length > 0 ? videos[0].position + 1 : 1;

  // Create video record
  const { data, error } = await supabase
    .from("videos")
    .insert({
      chapter_id: chapterId,
      title,
      bunny_video_id: bunnyVideoId,
      position,
    })
    .select()
    .single();

  if (error) {
    // Clean up Bunny video if database insert fails
    try {
      await deleteBunnyVideo(bunnyVideoId);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }

  revalidatePath("/admin/videos");
  return { videoId: data.id };
}

export async function updateVideo(id: string, title: string, chapterId: string) {
  await checkAdminAccess();
  const supabase = getSupabaseAdminClient();
  
  const { data, error } = await supabase
    .from("videos")
    .update({ title, chapter_id: chapterId, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/admin/videos");
  return data;
}

export async function deleteVideo(id: string) {
  await checkAdminAccess();
  const supabase = getSupabaseAdminClient();
  
  // Soft delete in database
  const { error } = await supabase
    .from("videos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/admin/videos");
}

// Position update actions
export async function updateChapterPositions(updates: { id: string; position: number }[]) {
  await checkAdminAccess();
  const supabase = getSupabaseAdminClient();
  
  for (const update of updates) {
    await supabase
      .from("chapters")
      .update({ position: update.position, updated_at: new Date().toISOString() })
      .eq("id", update.id);
  }

  revalidatePath("/admin/videos");
}

export async function updateVideoPositions(updates: { id: string; position: number; chapterId: string }[]) {
  await checkAdminAccess();
  const supabase = getSupabaseAdminClient();
  
  for (const update of updates) {
    await supabase
      .from("videos")
      .update({ 
        position: update.position, 
        chapter_id: update.chapterId,
        updated_at: new Date().toISOString() 
      })
      .eq("id", update.id);
  }

  revalidatePath("/admin/videos");
}

// Get Bunny video status (for polling)
export async function getVideoStatus(bunnyVideoId: string) {
  await checkAdminAccess();
  
  const BUNNY_LIBRARY_ID = "423953";
  const BUNNY_API_KEY = "70f9abb8-4960-4c9b-95364af7f0e6-25b4-419d";
  const BUNNY_API_BASE = "https://video.bunnycdn.com";
  
  const response = await fetch(`${BUNNY_API_BASE}/library/${BUNNY_LIBRARY_ID}/videos/${bunnyVideoId}`, {
    method: "GET",
    headers: {
      AccessKey: BUNNY_API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Bunny video status: ${error}`);
  }

  const video = await response.json();
  
  // Status codes
  const BUNNY_STATUS = {
    CREATED: 0,
    UPLOADING: 1,
    PROCESSING: 2,
    ENCODING: 3,
    FINISHED: 4,
    ERROR: 5,
  };
  
  function getStatusText(status: number, encodeProgress: number): string {
    switch (status) {
      case BUNNY_STATUS.CREATED:
        return "Erstellt";
      case BUNNY_STATUS.UPLOADING:
        return "Wird hochgeladen...";
      case BUNNY_STATUS.PROCESSING:
        return "Wird verarbeitet...";
      case BUNNY_STATUS.ENCODING:
        return `Wird kodiert... ${encodeProgress}%`;
      case BUNNY_STATUS.FINISHED:
        return "Bereit zur Veröffentlichung";
      case BUNNY_STATUS.ERROR:
        return "Fehler";
      default:
        return "Unbekannt";
    }
  }
  
  function isStatusReady(status: number): boolean {
    return status === BUNNY_STATUS.FINISHED;
  }
  
  return {
    status: video.status,
    encodeProgress: video.encodeProgress,
    statusText: getStatusText(video.status, video.encodeProgress),
    isReady: isStatusReady(video.status),
  };
}

