import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  LOH_CHAPTERS,
  LOH_COURSE_SLUG,
  LOH_PLACEHOLDER_BUNNY_ID,
  countLohVideos,
} from "../src/lib/lohVideoCatalog";

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function softDeleteCatalog() {
  const now = new Date().toISOString();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, slug")
    .is("deleted_at", null);

  for (const course of courses ?? []) {
    const { data: chapters } = await supabase
      .from("chapters")
      .select("id")
      .eq("course_id", course.id)
      .is("deleted_at", null);

    const chapterIds = (chapters ?? []).map((c) => c.id);
    if (chapterIds.length > 0) {
      await supabase
        .from("videos")
        .update({ deleted_at: now })
        .in("chapter_id", chapterIds)
        .is("deleted_at", null);
    }

    await supabase
      .from("chapters")
      .update({ deleted_at: now })
      .eq("course_id", course.id)
      .is("deleted_at", null);

    if (course.slug !== LOH_COURSE_SLUG) {
      await supabase
        .from("courses")
        .update({ published: false, deleted_at: now })
        .eq("id", course.id);
    }
  }
}

async function resetClientProgress() {
  await supabase.from("video_progress").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("user_video_unlocks").delete().neq("user_id", "00000000-0000-0000-0000-000000000000");
  console.log("Cleared video_progress and user_video_unlocks");
}

async function seedLohCourse() {
  const expectedVideos = countLohVideos();
  console.log(`Seeding LOH course with ${expectedVideos} videos…`);

  let courseId: string;
  const { data: existing } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", LOH_COURSE_SLUG)
    .maybeSingle();

  if (existing?.id) {
    courseId = existing.id;
    await supabase
      .from("courses")
      .update({
        title: "LOH Therapiepfad",
        description:
          "Einleitungskapitel (fix) + 7 Boards in personalisierter Reihenfolge je Überbegriff.",
        published: true,
        deleted_at: null,
      })
      .eq("id", courseId);
  } else {
    const { data: created, error } = await supabase
      .from("courses")
      .insert({
        title: "LOH Therapiepfad",
        slug: LOH_COURSE_SLUG,
        description:
          "Einleitungskapitel (fix) + 7 Boards in personalisierter Reihenfolge je Überbegriff.",
        published: true,
      })
      .select("id")
      .single();
    if (error || !created) throw error ?? new Error("Failed to create course");
    courseId = created.id;
  }

  let videoCount = 0;

  for (let i = 0; i < LOH_CHAPTERS.length; i++) {
    const chapterDef = LOH_CHAPTERS[i];
    const position = i + 1;

    const { data: chapter, error: chapterError } = await supabase
      .from("chapters")
      .insert({
        course_id: courseId,
        title: chapterDef.title,
        position,
        board_slug: chapterDef.boardSlug,
        is_intro: chapterDef.isIntro,
      })
      .select("id")
      .single();

    if (chapterError || !chapter) throw chapterError ?? new Error("chapter insert failed");

    const videoRows = chapterDef.videos.map((title, idx) => ({
      chapter_id: chapter.id,
      title,
      position: idx + 1,
      bunny_video_id: LOH_PLACEHOLDER_BUNNY_ID,
      requires_workbook: false,
    }));

    const { error: videosError } = await supabase.from("videos").insert(videoRows);
    if (videosError) throw videosError;

    videoCount += videoRows.length;
    console.log(`  + ${chapterDef.title}: ${videoRows.length} videos`);
  }

  if (videoCount !== expectedVideos) {
    throw new Error(`Expected ${expectedVideos} videos, inserted ${videoCount}`);
  }

  console.log(`Done. Course slug: ${LOH_COURSE_SLUG} (${videoCount} videos)`);

  const { data: unlockSeed, error: unlockError } = await supabase.rpc(
    "seed_all_clients_video_unlocks"
  );
  if (unlockError) {
    console.warn("Warning: could not re-seed user_video_unlocks:", unlockError.message);
  } else {
    console.log(`Re-seeded user_video_unlocks (${unlockSeed ?? 0} rows)`);
  }
}

async function main() {
  await softDeleteCatalog();
  await resetClientProgress();
  await seedLohCourse();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
