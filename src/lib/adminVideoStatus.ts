import type { VideoAccessState } from "@/lib/videoUnlock";

export type AdminStatusBadge = {
  label: string;
  className: string;
};

export function getAdminVideoStatusBadge(state: VideoAccessState): AdminStatusBadge {
  switch (state.status) {
    case "completed":
      return {
        label: "Abgeschlossen",
        className: "border-[#63eca9]/35 bg-[#63eca9]/10 text-[#63eca9]",
      };
    case "available":
      return {
        label: "Verfügbar",
        className: "border-blue-400/35 bg-blue-500/10 text-blue-300",
      };
    case "locked_sequence":
      return {
        label: "Wartet auf Vorvideo",
        className: "border-amber-400/35 bg-amber-500/10 text-amber-200",
      };
    case "locked_schedule":
      return {
        label: "Zeitlich gesperrt",
        className: "border-white/20 bg-white/5 text-white/70",
      };
    default:
      return {
        label: "Unbekannt",
        className: "border-white/20 bg-white/5 text-white/60",
      };
  }
}
