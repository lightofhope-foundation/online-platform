import { notFound } from "next/navigation";

import { NotionLeadDetailView } from "@/components/setter/NotionLeadDetailView";
import { checkSetterAccess } from "@/lib/checkSetterAccess";
import { fetchMetaLeadById } from "@/lib/notion/metaLeads";

export const dynamic = "force-dynamic";

export default async function SetterNotionLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await checkSetterAccess();
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId ?? "").trim();
  if (!id) notFound();

  const { lead, error, fetchedAt } = await fetchMetaLeadById(id);

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="typo-section font-normal text-white">Notion-Kundenkarte</h1>
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
          {error}
        </div>
      </div>
    );
  }

  if (!lead) notFound();

  return <NotionLeadDetailView lead={lead} fetchedAt={fetchedAt} />;
}
