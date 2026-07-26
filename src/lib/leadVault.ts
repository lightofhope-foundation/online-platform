import type { Database, Json } from "@/lib/database.types";

export type LeadVaultKind =
  | "folder"
  | "month"
  | "day"
  | "lead"
  | "template"
  | "column"
  | "archive";

export type LeadVaultBoard = {
  id: string;
  parent_id: string | null;
  title: string;
  kind: LeadVaultKind;
  accent: string;
  icon_key: string | null;
  pos_x: number;
  pos_y: number;
  sort_order: number;
  client_user_id: string | null;
  meta: Json;
  created_at: string;
  updated_at: string;
  child_count?: number;
};

export type LeadVaultArea = "admin" | "teamlead";

export function leadVaultBasePath(area: LeadVaultArea): string {
  // Teamlead teilt vorerst Admin-Pfad bis eigenes Portal existiert
  return "/admin/lead-vault";
}

export function accentClass(accent: string): string {
  switch (accent) {
    case "orange":
      return "bg-[#e8a04a]";
    case "yellow":
      return "bg-[#d4b84a]";
    case "blue":
      return "bg-[#5b8fd9]";
    case "teal":
      return "bg-[#4aabb8]";
    case "brown":
      return "bg-[#a67c52]";
    case "white":
      return "bg-white/90";
    case "green":
    default:
      return "bg-[#5cb87a]";
  }
}

export type LeadIntakeView = {
  setter_name?: string;
  closer_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  therapist_name?: string;
  price_per_session?: string;
  session_start?: string;
  agreement_signed?: boolean;
  platform_added?: boolean;
  problems?: string;
  side_note?: string;
  goals?: string;
  expectations?: string;
  consequences?: string;
  value_set?: string;
  value_tags?: string[];
  free_notes?: string;
};

export function parseIntake(raw: Json | null | undefined): LeadIntakeView {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as LeadIntakeView;
}

/** Row shape until database.types regenerates */
export type LeadVaultBoardRow = Database["public"]["Tables"] extends {
  lead_vault_boards: infer T;
}
  ? T extends { Row: infer R }
    ? R
    : never
  : {
      id: string;
      parent_id: string | null;
      title: string;
      kind: string;
      accent: string;
      icon_key: string | null;
      pos_x: number;
      pos_y: number;
      sort_order: number;
      client_user_id: string | null;
      meta: Json;
      created_at: string;
      updated_at: string;
    };
