import { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabaseClient';

export interface VideoProgress {
  id: string;
  video_id: string;
  last_second: number;
  percent: number;
  completed_at: string | null;
  updated_at: string;
}

export interface CourseProgress {
  courseId: string;
  totalVideos: number;
  completedVideos: number;
  totalWorkbooks: number;
  completedWorkbooks: number;
  lastVideoId: string | null;
  lastVideoTitle: string | null;
  lastVideoProgress: number | null;
}

export const useVideoProgress = () => {
  const [progress, setProgress] = useState<Map<string, VideoProgress>>(new Map());
  const [courseProgress, setCourseProgress] = useState<Map<string, CourseProgress>>(new Map());
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient();

  // Cache user ID to avoid repeated auth calls
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!cancelled && user) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    })();
    return () => { cancelled = true; };
  }, [supabase]);

  // Load user's video progress
  const loadProgress = useCallback(async () => {
    if (!userId) return;
    try {
      const { data: progressData, error } = await supabase
        .from('video_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching progress:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        return;
      }

      if (progressData) {
        const progressMap = new Map();
        progressData.forEach(p => {
          progressMap.set(p.video_id, p);
        });
        setProgress(progressMap);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  // Load course progress
  const loadCourseProgress = useCallback(async () => {
    if (!userId) return;
    try {
      // Fetch fresh progress data to avoid dependency issues
      const { data: progressData, error: progressError } = await supabase
        .from('video_progress')
        .select('*')
        .eq('user_id', userId);

      if (progressError) {
        console.error('Error fetching course progress rows:', {
          message: progressError.message,
          details: progressError.details,
          hint: progressError.hint,
          code: progressError.code,
        });
        return;
      }

      const progressMap = new Map<string, VideoProgress>();
      if (progressData) {
        progressData.forEach(p => {
          progressMap.set(p.video_id, p);
        });
      }

      // Get all courses
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('published', true)
        .is('deleted_at', null);

      if (coursesError) {
        console.error('Error fetching courses:', coursesError);
        return;
      }

      if (!courses || courses.length === 0) {
        setCourseProgress(new Map());
        return;
      }

      const courseProgressMap = new Map();

      // For each course, calculate progress
      for (const course of courses) {
        // Get chapters for this course
        const { data: chapters } = await supabase
          .from('chapters')
          .select('id')
          .eq('course_id', course.id);

        if (!chapters || chapters.length === 0) continue;

        const chapterIds = chapters.map(c => c.id);

        // Get videos for these chapters
        const { data: videos } = await supabase
          .from('videos')
          .select('id, title, position, requires_workbook')
          .in('chapter_id', chapterIds)
          .is('deleted_at', null);

        if (!videos || videos.length === 0) continue;

        // Count completed videos
        let completedVideos = 0;
        let lastVideoId: string | null = null;
        let lastVideoTitle: string | null = null;
        let lastVideoProgress: number | null = null;

        videos.forEach(video => {
          const videoProgress = progressMap.get(video.id);
          if (videoProgress && videoProgress.completed_at) {
            completedVideos++;
          }
          // Find the most recently updated video (by updated_at timestamp)
          if (videoProgress && videoProgress.updated_at) {
            if (!lastVideoId || new Date(videoProgress.updated_at) > new Date(progressMap.get(lastVideoId)?.updated_at || 0)) {
              lastVideoId = video.id;
              lastVideoTitle = video.title;
              lastVideoProgress = videoProgress.percent;
            }
          }
        });

        // Count workbooks (simplified - assume each video can have a workbook)
        const totalWorkbooks = videos.filter(v => v.requires_workbook).length;
        const completedWorkbooks = 0; // TODO: Implement workbook completion tracking

        courseProgressMap.set(course.id, {
          courseId: course.id,
          totalVideos: videos.length,
          completedVideos,
          totalWorkbooks,
          completedWorkbooks,
          lastVideoId,
          lastVideoTitle,
          lastVideoProgress
        });
      }

      setCourseProgress(courseProgressMap);
    } catch (error) {
      console.error('Error loading course progress:', error);
    }
  }, [supabase, userId]);

  // Update video progress
  const updateProgress = useCallback(async (
    videoId: string, 
    lastSecond: number, 
    percent: number, 
    completed: boolean = false
  ) => {
    if (!userId) {
      console.error('No authenticated user found');
      return false;
    }
    try {
      console.log('updateProgress called with:', { videoId, lastSecond, percent, completed });
      
      const progressData = {
        user_id: userId,
        video_id: videoId,
        last_second: Math.round(lastSecond),
        percent: Math.min(percent, 100),
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      // Use upsert to handle both insert and update cases
      // The unique constraint is on (user_id, video_id)
      const { data, error } = await supabase
        .from('video_progress')
        .upsert(progressData, { 
          onConflict: 'user_id,video_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error upserting progress:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
        });
        throw error;
      }
      
      if (data) {
        setProgress(prev => new Map(prev).set(videoId, data));
        // Reload course progress to update dashboard
        await loadCourseProgress();
      }

      return true; // Indicate success
    } catch (error: unknown) {
      const err = error as { message?: string; details?: string; hint?: string; code?: string; stack?: string };
      console.error('Error updating progress:', {
        message: err?.message || 'Unknown error',
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
        stack: err?.stack,
        fullError: error ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : 'No error object'
      });
      return false; // Indicate failure
    }
  }, [supabase, userId, loadCourseProgress]);

  // Get progress for a specific video
  const getVideoProgress = useCallback((videoId: string): VideoProgress | null => {
    return progress.get(videoId) || null;
  }, [progress]);

  // Get course progress
  const getCourseProgress = useCallback((courseId: string): CourseProgress | null => {
    return courseProgress.get(courseId) || null;
  }, [courseProgress]);

  // Get overall progress across all courses
  const getOverallProgress = useCallback(() => {
    let totalVideos = 0;
    let completedVideos = 0;
    let totalWorkbooks = 0;
    let completedWorkbooks = 0;

    courseProgress.forEach(course => {
      totalVideos += course.totalVideos;
      completedVideos += course.completedVideos;
      totalWorkbooks += course.totalWorkbooks;
      completedWorkbooks += course.completedWorkbooks;
    });

    return {
      totalVideos,
      completedVideos,
      totalWorkbooks,
      completedWorkbooks,
      videoProgress: totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0,
      workbookProgress: totalWorkbooks > 0 ? Math.round((completedWorkbooks / totalWorkbooks) * 100) : 0
    };
  }, [courseProgress]);

  useEffect(() => {
    if (userId) {
      loadProgress();
      loadCourseProgress();
    }
  }, [userId, loadProgress, loadCourseProgress]);

  return {
    progress,
    courseProgress,
    loading,
    updateProgress,
    getVideoProgress,
    getCourseProgress,
    getOverallProgress,
    refreshProgress: () => {
      loadProgress();
      loadCourseProgress();
    }
  };
};
