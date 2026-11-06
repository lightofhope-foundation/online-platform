export type PipelineStatus = "lead" | "client" | "lost";

export const PIPELINE_STATUS_LABEL: Record<PipelineStatus, string> = {
  lead: "Lead",
  client: "Klient",
  lost: "Verloren",
};

export function normalizePipelineStatus(
  value: string | null | undefined
): PipelineStatus {
  if (value === "lead" || value === "lost" || value === "client") return value;
  return "client";
}

export function canAssignTherapist(status: PipelineStatus): boolean {
  return status === "client";
}

export function canConvertLead(status: PipelineStatus): boolean {
  return status === "lead";
}

export function canMarkLost(status: PipelineStatus): boolean {
  return status === "lead";
}
