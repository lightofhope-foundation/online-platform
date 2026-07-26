import { LeadVaultBreadcrumbs } from "@/components/lead-vault/LeadVaultBreadcrumbs";
import { LeadVaultCanvas } from "@/components/lead-vault/LeadVaultCanvas";
import { LeadDetailCards } from "@/components/lead-vault/LeadDetailCards";
import {
  loadLeadDetail,
  loadLeadVaultBoard,
  loadLeadVaultBreadcrumbs,
  loadLeadVaultChildren,
} from "@/app/actions/leadVault";
import type { LeadVaultArea } from "@/lib/leadVault";

type Props = {
  area: LeadVaultArea;
  boardId?: string;
};

export async function LeadVaultPage({ area, boardId }: Props) {
  const crumbs = await loadLeadVaultBreadcrumbs(boardId ?? null);
  const current = boardId ? await loadLeadVaultBoard(boardId) : null;

  if (current?.kind === "lead") {
    const detail = await loadLeadDetail(boardId!);
    return (
      <div className="space-y-5">
        <LeadVaultBreadcrumbs area={area} crumbs={crumbs} />
        {detail ? (
          <LeadDetailCards
            name={detail.clientName}
            clientId={detail.clientId}
            accessRevoked={detail.accessRevoked}
            intake={detail.intake}
          />
        ) : (
          <p className="text-white/60">
            Lead nicht sichtbar (evtl. anderem Therapeuten zugeordnet).
          </p>
        )}
      </div>
    );
  }

  const children = await loadLeadVaultChildren(boardId ?? null);
  const title = current?.title ?? "Klientenakte";

  return (
    <div className="space-y-5">
      <LeadVaultBreadcrumbs area={area} crumbs={crumbs} />
      <LeadVaultCanvas area={area} boards={children} title={title} />
    </div>
  );
}
