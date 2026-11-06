/**
 * Soft-release feature flags for Dincer meeting prep.
 * Keep code paths; hide UI + skip expensive fetches.
 * Sync status with ../../soft-release-features.md
 */

export const SOFT_RELEASE = {
  /** Notion Meta pipeline / leadboard UI + fetches */
  notionLeadboard: false,
  /** Legacy „Offene Leads“ page that pulled Notion + unassigned LOH */
  notionOpenLeads: false,
  /** Erstgesprächler Notion EG board */
  notionEgBoard: false,
  /** Show unfinished „Phase XY“ labels / stub tiles in staff UI */
  phaseLabels: false,
  /** Orbit as soft-release focus (still reachable if nav not hidden) */
  orbitNav: false,
  /** Lead vault / Schachtel-Admin */
  leadVaultNav: false,
  /** Admin feedback stub */
  feedbackNav: false,
} as const;

export type SoftReleaseFlag = keyof typeof SOFT_RELEASE;

export function isSoftReleaseEnabled(flag: SoftReleaseFlag): boolean {
  return SOFT_RELEASE[flag];
}
