import Link from "next/link";
import { getContracts, getDocuments, getPartner, getPartners, getSite } from "@/lib/data";
import { PageHeader, Card, CardHeader, KpiTile, ActionButton } from "@/components/ui";
import { ContractStatusBadge } from "@/components/StatusBadge";
import { DocIcon, DownloadIcon, PlusIcon } from "@/components/Icons";
import { formatDate, titleCase } from "@/lib/utils";
import type { DocumentKind } from "@/lib/types";

const KIND_ORDER: DocumentKind[] = ["contract", "amendment", "invoice", "report", "permit", "technical", "signed_pdf", "other"];
const KIND_LABEL: Record<DocumentKind, string> = {
  contract: "Contracts",
  amendment: "Amendments",
  invoice: "Invoices",
  report: "Reports",
  permit: "Permits",
  technical: "Technical documentation",
  signed_pdf: "Signed PDFs",
  other: "Other",
};

export default function DocumentsPage() {
  const docs = getDocuments();
  const partners = getPartners();
  const contracts = getContracts();
  const partnerNameById = new Map(partners.map((p) => [p.id, p.name]));
  const byKind = new Map<DocumentKind, typeof docs>();
  for (const k of KIND_ORDER) byKind.set(k, docs.filter((d) => d.kind === k));

  return (
    <div>
      <PageHeader
        title="Documents & contracts"
        subtitle="One place for contracts, amendments, invoices, reports, permits, technical documentation and signed PDFs."
        actions={<ActionButton variant="primary"><PlusIcon className="h-4 w-4" /> Upload document</ActionButton>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile label="Documents" value={`${docs.length}`} icon={<DocIcon className="h-5 w-5" />} sub={`${(byKind.get("permit")?.length ?? 0) + (byKind.get("technical")?.length ?? 0)} technical & permits`} />
        <KpiTile label="Active contracts" value={`${contracts.filter((c) => c.status === "active").length}`} icon={<DocIcon className="h-5 w-5" />} sub={`${contracts.filter((c) => c.status === "pending_signature").length} pending signature`} />
        <KpiTile label="Invoices & reports" value={`${(byKind.get("invoice")?.length ?? 0) + (byKind.get("report")?.length ?? 0)}`} icon={<DocIcon className="h-5 w-5" />} />
        <KpiTile label="Partners covered" value={`${new Set(docs.map((d) => d.partnerId).filter(Boolean)).size}`} icon={<DocIcon className="h-5 w-5" />} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {KIND_ORDER.map((k) => {
            const list = byKind.get(k)!;
            if (!list.length) return null;
            return (
              <Card key={k}>
                <CardHeader title={KIND_LABEL[k]} subtitle={`${list.length} file${list.length === 1 ? "" : "s"}`} icon={<DocIcon className="h-5 w-5" />} />
                <ul className="divide-y divide-slate-100">
                  {list.map((d) => {
                    const site = d.siteId ? getSite(d.siteId) : undefined;
                    return (
                      <li key={d.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><DocIcon className="h-4.5 w-4.5" /></span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{d.name}</p>
                          <p className="text-[11px] text-muted">
                            {d.partnerId && <Link href={`/partners/${d.partnerId}`} className="hover:text-brand-600">{partnerNameById.get(d.partnerId)}</Link>}
                            {site && <> · <Link href={`/sites/${site.id}`} className="hover:text-brand-600">{site.name}</Link></>}
                            {" · "}{Math.round(d.sizeKb)} KB · uploaded {formatDate(d.uploadedAt)} by {d.uploadedBy}
                          </p>
                        </div>
                        <DownloadIcon className="h-4 w-4 shrink-0 text-slate-300" />
                      </li>
                    );
                  })}
                </ul>
              </Card>
            );
          })}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Contracts" subtitle="Frameworks, site-specific agreements and amendments" icon={<DocIcon className="h-5 w-5" />} />
            <div className="divide-y divide-slate-100">
              {contracts.map((c) => {
                const p = getPartner(c.partnerId);
                return (
                  <div key={c.id} className="px-5 py-3.5 sm:px-6">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-ink">{c.title}</p>
                      <ContractStatusBadge status={c.status} />
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {p && <Link href={`/partners/${p.id}`} className="hover:text-brand-600">{p.name}</Link>} · {titleCase(c.type)} · {formatDate(c.startsAt)} – {formatDate(c.endsAt)} · {Math.round(c.royaltyRate * 100)}% royalty
                      {c.signedBy ? ` · signed by ${c.signedBy}` : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
