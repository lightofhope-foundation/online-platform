type PreviousVideoStatusBadgeProps = {
  previousTitle: string;
  completed: boolean;
};

export function PreviousVideoStatusBadge({
  previousTitle,
  completed,
}: PreviousVideoStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        completed
          ? "border-[#63eca9]/35 bg-[#63eca9]/10 text-[#63eca9]"
          : "border-red-400/35 bg-red-500/10 text-red-300"
      }`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] leading-none ${
          completed ? "bg-[#63eca9]/25 text-[#63eca9]" : "bg-red-500/20 text-red-300"
        }`}
        aria-hidden
      >
        {completed ? "✓" : "!"}
      </span>
      <span>
        {previousTitle} – {completed ? "abgeschlossen" : "nicht abgeschlossen"}
      </span>
    </span>
  );
}
