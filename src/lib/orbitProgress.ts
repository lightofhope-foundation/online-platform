export type SessionMilestoneProgress = {
  releasedCount: number;
  totalCount: number;
  progressPercent: number;
};

/** Progress from standard session milestones only (excludes Notsitzungen). */
export function computeSessionMilestoneProgress(
  sessions: Array<{ is_special: boolean; released_to_client: boolean }>
): SessionMilestoneProgress {
  const standard = sessions.filter((s) => !s.is_special);
  const totalCount = standard.length;
  const releasedCount = standard.filter((s) => s.released_to_client).length;
  const progressPercent =
    totalCount > 0 ? Math.round((releasedCount / totalCount) * 100) : 0;
  return { releasedCount, totalCount, progressPercent };
}

/** Remaining progress maps to line length: 0% → 1 (far), 100% → 0 (at center). */
export function remainingProgressRatio(progressPercent: number): number {
  const clamped = Math.min(100, Math.max(0, progressPercent));
  return (100 - clamped) / 100;
}
