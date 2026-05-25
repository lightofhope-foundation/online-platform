type DashboardOverallProgressProps = {
  videoProgress: number;
  completedVideos: number;
  totalVideos: number;
  workbookProgress?: number;
  completedWorkbooks?: number;
  totalWorkbooks?: number;
};

function CenteredProgressBar({ percent }: { percent: number }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#63eca9] to-[#53e0b6] transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="shrink-0 text-sm font-medium tabular-nums text-white">
        {percent}%
      </span>
    </div>
  );
}

export function DashboardOverallProgress({
  videoProgress,
  completedVideos,
  totalVideos,
  workbookProgress = 0,
  completedWorkbooks = 0,
  totalWorkbooks = 0,
}: DashboardOverallProgressProps) {
  const showWorkbooks = totalWorkbooks > 0;

  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,30%)_minmax(0,70%)] sm:gap-x-5">
        <div className="flex flex-col justify-center sm:pr-2">
          <h2 className="text-lg font-semibold text-white">Gesamtfortschritt</h2>
          <p className="mt-1 text-xs text-white/50">
            {completedVideos} von {totalVideos} Videos abgeschlossen
          </p>
          {showWorkbooks && (
            <p className="mt-1 text-xs text-white/40">
              {completedWorkbooks} von {totalWorkbooks} Workbooks abgeschlossen
            </p>
          )}
        </div>

        <div className="flex min-h-[44px] flex-col justify-center gap-3 py-0.5">
          <CenteredProgressBar percent={videoProgress} />
          {showWorkbooks && <CenteredProgressBar percent={workbookProgress} />}
        </div>
      </div>
    </div>
  );
}
