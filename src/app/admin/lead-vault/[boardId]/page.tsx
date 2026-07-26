import { LeadVaultPage } from "@/components/lead-vault/LeadVaultPage";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ boardId: string }> };

export default async function AdminLeadVaultBoardPage({ params }: Props) {
  const { boardId } = await params;
  return <LeadVaultPage area="admin" boardId={boardId} />;
}
