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
  const supabase = getSupabaseBrowserClient();

  // Load user's video progress
  const loadProgress = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: progressData } = await supabase
        .from('video_progress')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null);

      if (progressData) {
        const progressMap = new Map();
        progressData.forEach(p => progressMap.set(p.video_id, p));
        setProgress(progressMap);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Load course progress
  const loadCourseProgress = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all courses with video and workbook counts
      const { data: courses } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          videos!inner(
            id,
            title,
            position,
            requires_workbook,
            video_progress!inner(
              last_second,
              percent,
              completed_at
            )
          ),
          workbooks!inner(
            id,
            workbook_submissions!inner(
              status
            )
          )
        `)
        .eq('published', true)
        .is('deleted_at', null);

      if (courses) {
        const courseProgressMap = new Map();
        
        courses.forEach(course => {
          const videos = course.videos || [];
          const totalVideos = videos.length;
          const completedVideos = videos.filter(v => 
            v.video_progress?.[0]?.completed_at !== null
          ).length;
          
          const workbooks = course.workbooks || [];
          const totalWorkbooks = workbooks.length;
          const completedWorkbooks = workbooks.filter(w => 
            w.workbook_submissions?.[0]?.status === 'submitted'
          ).length;

          // Find last watched video
          let lastVideoId = null;
          let lastVideoTitle = null;
          let lastVideoProgress = null;
          
          const sortedVideos = videos.sort((a, b) => a.position - b.position);
          for (let i = sortedVideos.length - 1; i >= 0; i--) {
            const video = sortedVideos[i];
            if (video.video_progress?.[0]) {
              lastVideoId = video.id;
              lastVideoTitle = video.title;
              lastVideoProgress = video.video_progress[0].percent;
              break;
            }
          }

          courseProgressMap.set(course.id, {
            courseId: course.id,
            totalVideos,
            completedVideos,
            totalWorkbooks,
            completedWorkbooks,
            lastVideoId,
            lastVideoTitle,
            lastVideoProgress
          });
        });

        setCourseProgress(courseProgressMap);
      }
    } catch (error) {
      console.error('Error loading course progress:', error);
    }
  }, [supabase]);

  // Update video progress
  const updateProgress = useCallback(async (
    videoId: string, 
    lastSecond: number, 
    percent: number, 
    completed: boolean = false
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const progressData = {
        user_id: user.id,
        video_id: videoId,
        last_second: lastSecond,
        percent: Math.min(percent, 100),
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      // Check if progress exists
      const existingProgress = progress.get(videoId);
      
      if (existingProgress) {
        // Update existing progress
        const { data, error } = await supabase
          .from('video_progress')
          .update(progressData)
          .eq('id', existingProgress.id)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setProgress(prev => new Map(prev).set(videoId, data));
        }
      } else {
        // Create new progress
        const { data, error } = await supabase
          .from('video_progress')
          .insert(progressData)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setProgress(prev => new Map(prev).set(videoId, data));
        }
      }

      // Reload course progress after update
      await loadCourseProgress();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }, [supabase, progress, loadCourseProgress]);

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
    loadProgress();
    loadCourseProgress();
  }, [loadProgress, loadCourseProgress]);

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
