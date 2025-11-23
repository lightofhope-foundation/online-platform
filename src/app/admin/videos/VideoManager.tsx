"use client";

import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PencilIcon } from "@/components/icons/Icons";
import {
  createCourse,
  createChapter,
  createBunnyVideoForUpload,
  createVideoRecord,
  updateCourse,
  updateChapter,
  updateVideo,
  deleteCourse,
  deleteChapter,
  deleteVideo,
  updateChapterPositions,
  updateVideoPositions,
  getVideoStatus,
} from "./actions";
import { uploadBunnyVideo, BUNNY_STATUS } from "@/lib/bunnyCDN";

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

interface VideoManagerProps {
  initialCourses: Course[];
  initialChapters: Chapter[];
  initialVideos: Video[];
}

interface UploadState {
  bunnyVideoId: string | null;
  progress: number;
  status: number;
  encodeProgress: number;
  statusText: string;
  isReady: boolean;
  chapterId: string;
  title: string;
}

export default function VideoManager({
  initialCourses,
  initialChapters,
  initialVideos,
}: VideoManagerProps) {
  const [courses] = useState(initialCourses);
  const [chapters, setChapters] = useState(initialChapters);
  const [videos, setVideos] = useState(initialVideos);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    type: "course" | "chapter" | "video";
    id: string;
    field: string;
  } | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddChapter, setShowAddChapter] = useState<string | null>(null);
  const [showAddVideo, setShowAddVideo] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "course" | "chapter" | "video";
    id: string;
    name: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Organize data
  const chaptersByCourse = new Map<string, Chapter[]>();
  const videosByChapter = new Map<string, Video[]>();

  chapters.forEach((ch) => {
    if (!chaptersByCourse.has(ch.course_id)) {
      chaptersByCourse.set(ch.course_id, []);
    }
    chaptersByCourse.get(ch.course_id)!.push(ch);
  });

  videos.forEach((v) => {
    if (!videosByChapter.has(v.chapter_id)) {
      videosByChapter.set(v.chapter_id, []);
    }
    videosByChapter.get(v.chapter_id)!.push(v);
  });

  // Sort by position
  chaptersByCourse.forEach((chapters) => {
    chapters.sort((a, b) => a.position - b.position);
  });
  videosByChapter.forEach((videos) => {
    videos.sort((a, b) => a.position - b.position);
  });

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if it's a chapter drag
    const activeChapter = chapters.find((c) => c.id === activeId);
    if (activeChapter) {
      const overChapter = chapters.find((c) => c.id === overId);
      if (overChapter && activeChapter.course_id === overChapter.course_id) {
        const courseChapters = chapters.filter((c) => c.course_id === activeChapter.course_id);
        const oldIndex = courseChapters.findIndex((c) => c.id === activeId);
        const newIndex = courseChapters.findIndex((c) => c.id === overId);
        const newChapters = arrayMove(courseChapters, oldIndex, newIndex);
        const updatedChapters = chapters.map((ch) => {
          const newPos = newChapters.findIndex((nc) => nc.id === ch.id);
          if (newPos !== -1 && ch.course_id === activeChapter.course_id) {
            return { ...ch, position: newPos + 1 };
          }
          return ch;
        });
        setChapters(updatedChapters);
        setHasUnsavedChanges(true);
      }
      return;
    }

    // Check if it's a video drag
    const activeVideo = videos.find((v) => v.id === activeId);
    if (activeVideo) {
      const overVideo = videos.find((v) => v.id === overId);
      if (overVideo) {
        // Same chapter
        if (activeVideo.chapter_id === overVideo.chapter_id) {
          const chapterVideos = videos.filter((v) => v.chapter_id === activeVideo.chapter_id);
          const oldIndex = chapterVideos.findIndex((v) => v.id === activeId);
          const newIndex = chapterVideos.findIndex((v) => v.id === overId);
          const newVideos = arrayMove(chapterVideos, oldIndex, newIndex);
          const updatedVideos = videos.map((v) => {
            const newPos = newVideos.findIndex((nv) => nv.id === v.id);
            if (newPos !== -1 && v.chapter_id === activeVideo.chapter_id) {
              return { ...v, position: newPos + 1 };
            }
            return v;
          });
          setVideos(updatedVideos);
          setHasUnsavedChanges(true);
        } else {
          // Different chapter - move video to new chapter
          const targetChapterVideos = videos.filter((v) => v.chapter_id === overVideo.chapter_id);
          const newPosition = targetChapterVideos.length + 1;
          const updatedVideos = videos.map((v) => {
            if (v.id === activeId) {
              return { ...v, chapter_id: overVideo.chapter_id, position: newPosition };
            }
            return v;
          });
          setVideos(updatedVideos);
          setHasUnsavedChanges(true);
        }
      }
    }
  };

  // Save positions
  const handleSavePositions = async () => {
    try {
      // Update chapter positions
      const chapterUpdates = chapters.map((ch) => ({
        id: ch.id,
        position: ch.position,
      }));
      await updateChapterPositions(chapterUpdates);

      // Update video positions
      const videoUpdates = videos.map((v) => ({
        id: v.id,
        position: v.position,
        chapterId: v.chapter_id,
      }));
      await updateVideoPositions(videoUpdates);

      setHasUnsavedChanges(false);
      window.location.reload(); // Refresh to get latest data
    } catch (error) {
      console.error("Failed to save positions:", error);
      alert("Fehler beim Speichern der Reihenfolge");
    }
  };

  // Poll video status
  useEffect(() => {
    if (!uploadState || !uploadState.bunnyVideoId || uploadState.isReady) return;

    const interval = setInterval(async () => {
      try {
        const status = await getVideoStatus(uploadState.bunnyVideoId!);
        setUploadState((prev) =>
          prev
            ? {
                ...prev,
                status: status.status,
                encodeProgress: status.encodeProgress,
                statusText: status.statusText,
                isReady: status.isReady,
              }
            : null
        );

        if (status.isReady) {
          clearInterval(interval);
        }
      } catch (error) {
        console.error("Failed to get video status:", error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [uploadState]);

  // Handle file upload
  const handleFileUpload = async (file: File, chapterId: string, title: string) => {
    const acceptedTypes = [
      "4mv",
      "amv",
      "avi",
      "flv",
      "m4p",
      "m4v",
      "mov",
      "mp3",
      "mp4",
      "mpeg",
      "mpg",
      "mxf",
      "ogg",
      "ts",
      "vod",
      "wav",
      "webm",
      "wmv",
    ];
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    if (!fileExt || !acceptedTypes.includes(fileExt)) {
      alert(`Dateityp nicht unterstützt. Erlaubt: ${acceptedTypes.join(", ")}`);
      return;
    }

    try {
      // Create Bunny video
      console.log("Creating Bunny video...");
      const { bunnyVideoId } = await createBunnyVideoForUpload(title);
      console.log("Bunny video created:", bunnyVideoId);
      
      setUploadState({
        bunnyVideoId,
        progress: 0,
        status: 1, // UPLOADING
        encodeProgress: 0,
        statusText: "Wird hochgeladen...",
        isReady: false,
        chapterId,
        title,
      });

      // Upload file
      console.log("Uploading file to Bunny...");
      await uploadBunnyVideo(bunnyVideoId, file, (progress) => {
        setUploadState((prev) => (prev ? { ...prev, progress } : null));
      });
      console.log("File upload completed");

      // Verify upload by checking video status
      console.log("Verifying upload...");
      const verifyStatus = await getVideoStatus(bunnyVideoId);
      console.log("Video status after upload:", verifyStatus);
      
      if (verifyStatus.status === BUNNY_STATUS.ERROR) {
        throw new Error("Video upload failed - Bunny returned error status");
      }

      // Create video record only after successful upload
      console.log("Creating video record in database...");
      await createVideoRecord(chapterId, title, bunnyVideoId);
      console.log("Video record created");
      
      setUploadState((prev) =>
        prev
          ? {
              ...prev,
              progress: 100,
              status: verifyStatus.status,
              encodeProgress: verifyStatus.encodeProgress,
              statusText: verifyStatus.statusText,
            }
          : null
      );

      // Start polling if not already ready
      if (!verifyStatus.isReady) {
        const pollInterval = setInterval(async () => {
          try {
            const status = await getVideoStatus(bunnyVideoId);
            setUploadState((prev) =>
              prev
                ? {
                    ...prev,
                    status: status.status,
                    encodeProgress: status.encodeProgress,
                    statusText: status.statusText,
                    isReady: status.isReady,
                  }
                : null
            );

            if (status.isReady) {
              clearInterval(pollInterval);
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }
          } catch (error) {
            console.error("Failed to get video status:", error);
            clearInterval(pollInterval);
          }
        }, 3000);
      } else {
        // Already ready, reload immediately
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";
      alert(`Fehler beim Hochladen des Videos: ${errorMessage}`);
      setUploadState(null);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Videos &amp; Kurse verwalten</h1>
          <div className="flex gap-3">
            {hasUnsavedChanges && (
              <button
                onClick={handleSavePositions}
                className="px-4 py-2 rounded border border-[#63eca9] bg-[#63eca9]/10 text-[#63eca9] hover:bg-[#63eca9]/20 text-sm font-medium"
              >
                Reihenfolge speichern
              </button>
            )}
            <a href="/admin" className="text-sm text-[#63eca9] hover:underline">
              Zurück zum Dashboard
            </a>
          </div>
        </div>

        {/* Upload Status */}
        {uploadState && (
          <div className="rounded-lg border border-white/20 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{uploadState.title}</span>
              <span
                className={`text-sm ${
                  uploadState.isReady ? "text-green-400" : "text-yellow-400"
                }`}
              >
                {uploadState.statusText}
              </span>
            </div>
            {uploadState.status === 1 && (
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-[#63eca9] h-2 rounded-full transition-all"
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>
            )}
            {uploadState.status === 3 && (
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all"
                  style={{ width: `${uploadState.encodeProgress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Add Course Button */}
        <button
          onClick={() => setShowAddCourse(true)}
          className="px-4 py-2 rounded border border-white/20 hover:bg-white/10 text-sm"
        >
          + Neuen Kurs hinzufügen
        </button>

        {/* Courses */}
        {courses.map((course) => (
          <CourseSection
            key={course.id}
            course={course}
            chapters={chaptersByCourse.get(course.id) || []}
            videosByChapter={videosByChapter}
            onEdit={(field, value) => {
              if (field === "title" || field === "description") {
                setEditingItem({ type: "course", id: course.id, field });
                setEditValues({ [field]: value });
              }
            }}
            onDelete={() =>
              setDeleteConfirm({
                type: "course",
                id: course.id,
                name: course.title,
              })
            }
            onAddChapter={() => setShowAddChapter(course.id)}
            editingItem={editingItem}
            editValues={editValues}
            onUpdateEditValues={setEditValues}
            onSaveEdit={async () => {
              if (editingItem?.type === "course" && editingItem.id === course.id) {
                await updateCourse(
                  course.id,
                  editValues.title || course.title,
                  editValues.description || course.description || ""
                );
                setEditingItem(null);
                window.location.reload();
              }
            }}
            onCancelEdit={() => {
              setEditingItem(null);
              setEditValues({});
            }}
            showAddChapter={showAddChapter === course.id}
            onAddChapterSubmit={async (title: string) => {
              await createChapter(course.id, title);
              setShowAddChapter(null);
              window.location.reload();
            }}
            onAddChapterCancel={() => setShowAddChapter(null)}
            showAddVideo={showAddVideo}
            onAddVideo={(chapterId) => setShowAddVideo(chapterId)}
            onAddVideoCancel={() => setShowAddVideo(null)}
            onFileUpload={handleFileUpload}
            onDeleteChapter={(chapterId, chapterTitle) =>
              setDeleteConfirm({
                type: "chapter",
                id: chapterId,
                name: chapterTitle,
              })
            }
            onDeleteVideo={(videoId, videoTitle) =>
              setDeleteConfirm({
                type: "video",
                id: videoId,
                name: videoTitle,
              })
            }
            setEditingItem={setEditingItem}
            setEditValues={setEditValues}
          />
        ))}

        {/* Add Course Modal */}
        {showAddCourse && (
          <AddCourseModal
            onSave={async (title, description) => {
              await createCourse(title, description);
              setShowAddCourse(false);
              window.location.reload();
            }}
            onCancel={() => setShowAddCourse(false)}
          />
        )}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <DeleteConfirmModal
            name={deleteConfirm.name}
            onConfirm={async () => {
              try {
                if (deleteConfirm.type === "course") {
                  await deleteCourse(deleteConfirm.id);
                } else if (deleteConfirm.type === "chapter") {
                  await deleteChapter(deleteConfirm.id);
                } else if (deleteConfirm.type === "video") {
                  await deleteVideo(deleteConfirm.id);
                }
                setDeleteConfirm(null);
                window.location.reload();
              } catch (error) {
                console.error("Delete failed:", error);
                alert("Fehler beim Löschen");
              }
            }}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </div>
    </DndContext>
  );
}

// Sortable Chapter Component
function SortableChapter({
  chapter,
  videos,
  onEdit,
  onDelete,
  onAddVideo,
  showAddVideo,
  onAddVideoCancel,
  onFileUpload,
  onDeleteVideo,
  editingItem,
  editValues,
  onUpdateEditValues,
  onSaveEdit,
  onCancelEdit,
  chapters,
  setEditingItem,
  setEditValues,
}: {
  chapter: Chapter;
  videos: Video[];
  onEdit: (field: string, value: string) => void;
  onDelete: () => void;
  onAddVideo: () => void;
  showAddVideo: boolean;
  onAddVideoCancel: () => void;
  onFileUpload: (file: File, chapterId: string, title: string) => void;
  onDeleteVideo: (videoId: string, videoTitle: string) => void;
  editingItem: { type: string; id: string; field: string } | null;
  editValues: Record<string, string>;
  onUpdateEditValues: (values: Record<string, string>) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  chapters: Chapter[];
  setEditingItem: React.Dispatch<React.SetStateAction<{ type: "course" | "chapter" | "video"; id: string; field: string } | null>>;
  setEditValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: chapter.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isEditing = editingItem?.type === "chapter" && editingItem.id === chapter.id;

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border border-white/10">
      <div className="flex items-center justify-between px-3 py-2 bg-white/5">
        <div className="flex items-center gap-2 flex-1">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            ⋮⋮
          </div>
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={editValues.title ?? chapter.title}
                onChange={(e) => onUpdateEditValues({ ...editValues, title: e.target.value })}
                className="bg-transparent border border-white/20 rounded px-2 py-1 flex-1"
                autoFocus
              />
              <button onClick={onSaveEdit} className="text-sm text-[#63eca9] hover:underline">
                Speichern
              </button>
              <button onClick={onCancelEdit} className="text-sm text-white/60 hover:underline">
                Abbrechen
              </button>
            </div>
          ) : (
            <span className="font-medium">{chapter.position}. {chapter.title}</span>
          )}
        </div>
        {!isEditing && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit("title", chapter.title)}
              className="p-1 hover:bg-white/10 rounded"
            >
              <PencilIcon size={16} />
            </button>
            <button onClick={onAddVideo} className="text-sm text-[#63eca9] hover:underline">
              + Video
            </button>
            <button onClick={onDelete} className="text-sm text-red-400 hover:underline">
              Löschen
            </button>
          </div>
        )}
      </div>
        <SortableContext items={videos.map((v) => v.id)} strategy={verticalListSortingStrategy}>
          <div className="divide-y divide-white/10">
            {videos.map((video) => (
              <SortableVideo
                key={video.id}
                video={video}
                onEdit={(field, value) => {
                  if (field === "title") {
                    setEditingItem({ type: "video", id: video.id, field: "title" });
                    setEditValues({ title: value });
                  } else if (field === "chapter") {
                    setEditingItem({ type: "video", id: video.id, field: "chapter" });
                    setEditValues({ chapterId: value });
                  }
                }}
                onDelete={() => onDeleteVideo(video.id, video.title)}
                editingItem={editingItem}
                editValues={editValues}
                onUpdateEditValues={setEditValues}
                onSaveEdit={async () => {
                  if (editingItem?.type === "video" && editingItem.id === video.id) {
                    await updateVideo(
                      video.id,
                      editValues.title || video.title,
                      editValues.chapterId || video.chapter_id
                    );
                    setEditingItem(null);
                    window.location.reload();
                  }
                }}
                onCancelEdit={() => {
                  setEditingItem(null);
                  setEditValues({});
                }}
                chapters={chapters}
              />
            ))}
            {videos.length === 0 && (
              <div className="px-3 py-3 text-sm text-white/60">Keine Videos in diesem Kapitel.</div>
            )}
          </div>
        </SortableContext>
      {showAddVideo && (
        <AddVideoModal
          chapterId={chapter.id}
          onUpload={onFileUpload}
          onCancel={onAddVideoCancel}
        />
      )}
    </div>
  );
}

// Sortable Video Component
function SortableVideo({
  video,
  onEdit,
  onDelete,
  editingItem,
  editValues,
  onUpdateEditValues,
  onSaveEdit,
  onCancelEdit,
  chapters,
}: {
  video: Video;
  onEdit: (field: string, value: string) => void;
  onDelete: () => void;
  editingItem: { type: string; id: string; field: string } | null;
  editValues: Record<string, string>;
  onUpdateEditValues: (values: Record<string, string>) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  chapters: Chapter[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: video.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isEditing = editingItem?.type === "video" && editingItem.id === video.id;

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between px-3 py-2">
      <div className="flex items-center gap-2 flex-1">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          ⋮⋮
        </div>
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            {editingItem.field === "title" ? (
              <input
                type="text"
                value={editValues.title ?? video.title}
                onChange={(e) => onUpdateEditValues({ ...editValues, title: e.target.value })}
                className="bg-transparent border border-white/20 rounded px-2 py-1 flex-1"
                autoFocus
              />
            ) : (
              <select
                value={editValues.chapterId ?? video.chapter_id}
                onChange={(e) => onUpdateEditValues({ ...editValues, chapterId: e.target.value })}
                className="bg-transparent border border-white/20 rounded px-2 py-1"
              >
                {chapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.title}
                  </option>
                ))}
              </select>
            )}
            <button onClick={onSaveEdit} className="text-sm text-[#63eca9] hover:underline">
              Speichern
            </button>
            <button onClick={onCancelEdit} className="text-sm text-white/60 hover:underline">
              Abbrechen
            </button>
          </div>
        ) : (
          <div>
            <div className="font-medium">
              {video.position}. {video.title}
              {video.deleted_at && <span className="ml-2 text-xs text-red-400">(gelöscht)</span>}
            </div>
            <div className="text-xs text-white/60">{video.bunny_video_id || "—"}</div>
          </div>
        )}
      </div>
      {!isEditing && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit("title", video.title)}
            className="p-1 hover:bg-white/10 rounded"
          >
            <PencilIcon size={16} />
          </button>
          {!video.deleted_at && (
            <button onClick={onDelete} className="text-sm text-red-400 hover:underline">
              Löschen
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Course Section Component
function CourseSection({
  course,
  chapters,
  videosByChapter,
  onEdit,
  onDelete,
  onAddChapter,
  editingItem,
  editValues,
  onUpdateEditValues,
  onSaveEdit,
  onCancelEdit,
  showAddChapter,
  onAddChapterSubmit,
  onAddChapterCancel,
  showAddVideo,
  onAddVideo,
  onAddVideoCancel,
  onFileUpload,
  onDeleteChapter,
  onDeleteVideo,
  setEditingItem,
  setEditValues,
}: {
  course: Course;
  chapters: Chapter[];
  videosByChapter: Map<string, Video[]>;
  onEdit: (field: string, value: string) => void;
  onDelete: () => void;
  onAddChapter: () => void;
  editingItem: { type: string; id: string; field: string } | null;
  editValues: Record<string, string>;
  onUpdateEditValues: (values: Record<string, string>) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  showAddChapter: boolean;
  onAddChapterSubmit: (title: string) => void;
  onAddChapterCancel: () => void;
  showAddVideo: string | null;
  onAddVideo: (chapterId: string) => void;
  onAddVideoCancel: () => void;
  onFileUpload: (file: File, chapterId: string, title: string) => void;
  onDeleteChapter: (chapterId: string, chapterTitle: string) => void;
  onDeleteVideo: (videoId: string, videoTitle: string) => void;
  setEditingItem: React.Dispatch<React.SetStateAction<{ type: "course" | "chapter" | "video"; id: string; field: string } | null>>;
  setEditValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const isEditing = editingItem?.type === "course" && editingItem.id === course.id;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        {isEditing && editingItem.field === "title" ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={editValues.title ?? course.title}
              onChange={(e) => onUpdateEditValues({ ...editValues, title: e.target.value })}
              className="bg-transparent border border-white/20 rounded px-2 py-1 flex-1"
              autoFocus
            />
            <button onClick={onSaveEdit} className="text-sm text-[#63eca9] hover:underline">
              Speichern
            </button>
            <button onClick={onCancelEdit} className="text-sm text-white/60 hover:underline">
              Abbrechen
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-medium">{course.title}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit("title", course.title)}
                className="p-1 hover:bg-white/10 rounded"
              >
                <PencilIcon size={18} />
              </button>
              {course.description && (
                <button
                  onClick={() => onEdit("description", course.description || "")}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <PencilIcon size={18} />
                </button>
              )}
              <button onClick={onDelete} className="text-sm text-red-400 hover:underline">
                Löschen
              </button>
            </div>
          </>
        )}
      </div>
      {isEditing && editingItem.field === "description" ? (
        <div className="mb-3">
          <textarea
            value={editValues.description ?? course.description ?? ""}
            onChange={(e) => onUpdateEditValues({ ...editValues, description: e.target.value })}
            className="w-full bg-transparent border border-white/20 rounded px-2 py-1"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button onClick={onSaveEdit} className="text-sm text-[#63eca9] hover:underline">
              Speichern
            </button>
            <button onClick={onCancelEdit} className="text-sm text-white/60 hover:underline">
              Abbrechen
            </button>
          </div>
        </div>
      ) : (
        course.description && (
          <p className="text-sm text-white/70 mb-3">{course.description}</p>
        )
      )}
      <div className="space-y-2">
        <SortableContext
          items={chapters.map((c: Chapter) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {chapters.map((chapter: Chapter) => (
            <SortableChapter
              key={chapter.id}
              chapter={chapter}
              videos={videosByChapter.get(chapter.id) || []}
              onEdit={(field, value) => {
                if (field === "title") {
                  setEditingItem({ type: "chapter", id: chapter.id, field: "title" });
                  setEditValues({ title: value });
                }
              }}
              onDelete={() => onDeleteChapter(chapter.id, chapter.title)}
              onAddVideo={() => onAddVideo(chapter.id)}
              showAddVideo={showAddVideo === chapter.id}
              onAddVideoCancel={onAddVideoCancel}
              onFileUpload={onFileUpload}
              onDeleteVideo={onDeleteVideo}
              editingItem={editingItem}
              editValues={editValues}
              onUpdateEditValues={setEditValues}
              onSaveEdit={async () => {
                if (editingItem?.type === "chapter" && editingItem.id === chapter.id) {
                  await updateChapter(chapter.id, editValues.title || chapter.title);
                  setEditingItem(null);
                  window.location.reload();
                }
              }}
              onCancelEdit={() => {
                setEditingItem(null);
                setEditValues({});
              }}
              chapters={chapters}
              setEditingItem={setEditingItem}
              setEditValues={setEditValues}
            />
          ))}
        </SortableContext>
        {showAddChapter && (
          <AddChapterModal
            onSave={onAddChapterSubmit}
            onCancel={onAddChapterCancel}
          />
        )}
        <button
          onClick={onAddChapter}
          className="text-sm text-[#63eca9] hover:underline"
        >
          + Neues Kapitel hinzufügen
        </button>
      </div>
    </div>
  );
}

// Modal components (simplified - will add full implementations)
function AddCourseModal({ onSave, onCancel }: { onSave: (title: string, description: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border border-white/20 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Neuen Kurs hinzufügen</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Titel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent border border-white/20 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Beschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-transparent border border-white/20 rounded px-3 py-2"
              rows={3}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={onCancel} className="px-4 py-2 rounded border border-white/20 hover:bg-white/10">
              Abbrechen
            </button>
            <button
              onClick={() => onSave(title, description)}
              className="px-4 py-2 rounded bg-[#63eca9] text-black hover:bg-[#63eca9]/80"
            >
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddChapterModal({ onSave, onCancel }: { onSave: (title: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");

  return (
    <div className="bg-white/5 border border-white/20 rounded-lg p-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Kapitel-Titel"
        className="w-full bg-transparent border border-white/20 rounded px-3 py-2 mb-2"
      />
      <div className="flex gap-2">
        <button onClick={() => onSave(title)} className="text-sm text-[#63eca9] hover:underline">
          Speichern
        </button>
        <button onClick={onCancel} className="text-sm text-white/60 hover:underline">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

function AddVideoModal({
  chapterId,
  onUpload,
  onCancel,
}: {
  chapterId: string;
  onUpload: (file: File, chapterId: string, title: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="bg-white/5 border border-white/20 rounded-lg p-4 mt-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Video-Titel"
        className="w-full bg-transparent border border-white/20 rounded px-3 py-2 mb-2"
      />
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        accept=".4mv,.amv,.avi,.flv,.m4p,.m4v,.mov,.mp3,.mp4,.mpeg,.mpg,.mxf,.ogg,.ts,.vod,.wav,.webm,.wmv"
        className="w-full bg-transparent border border-white/20 rounded px-3 py-2 mb-2"
      />
      <div className="flex gap-2">
        <button
          onClick={() => file && onUpload(file, chapterId, title)}
          disabled={!file || !title}
          className="text-sm text-[#63eca9] hover:underline disabled:text-white/40"
        >
          Hochladen
        </button>
        <button onClick={onCancel} className="text-sm text-white/60 hover:underline">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  name,
  onConfirm,
  onCancel,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border border-white/20 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Löschen bestätigen</h3>
        <p className="text-white/70 mb-6">
          Möchten Sie &quot;{name}&quot; wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded border border-white/20 hover:bg-white/10">
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
          >
            Löschen
          </button>
        </div>
      </div>
    </div>
  );
}

