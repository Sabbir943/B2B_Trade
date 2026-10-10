import { redirect } from "next/navigation";
import CheckoutPanel from "@/components/checkout-panel";
import { Badge } from "@/components/ui";
import { WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import { getInvoice, BANK_DETAILS } from "@/lib/billing";
import { plain, formatDate } from "@/lib/refs";

export const instant = false;

export const metadata = { title: "Checkout" };

/**
 * §7.7.2 — one invoice at a time. Ownership is re-checked server-side: the
 * invoice must belong to the signed-in member before anything renders.
 */
export default async function CheckoutPage({ searchParams }) {
  const { invoice: invoiceId } = await searchParams;
  const { user } = await requirePermission("member.membership");

  const invoice = invoiceId ? await getInvoice(invoiceId) : null;
  if (!invoice || invoice.email !== String(user.email).toLowerCase()) {
    redirect("/dashboard/membership");
  }

  const amount =
    invoice.currency === "BDT"
      ? `BDT ${Number(invoice.amountBdt || 0).toLocaleString()}`
      : `$${Number(invoice.amountUsd || 0).toLocaleString()}`;

  return (
    <>
      <WorkspaceHeader
        title="Checkout"
        description={`${invoice.label} · due ${formatDate(invoice.dueAt || invoice.createdAt)}`}
        actions={<Badge tone={invoice.status === "paid" ? "green" : "amber"}>{invoice.status}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="panel p-6">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <p className="label-xs">{invoice.id}</p>
              <p className="mt-1 font-display text-xl font-bold text-primary">{amount}</p>
            </div>
            <p className="text-[13px] text-slate-500">{invoice.label}</p>
          </div>

          <CheckoutPanel invoice={plain(invoice)} bankDetails={BANK_DETAILS} />
        </div>

        <aside className="panel h-fit p-5">
          <p className="label-xs">What happens next</p>
          <ol className="mt-3 space-y-3 text-[13px] leading-6 text-slate-600">
            <li>1 · Gateway payments activate instantly and issue the final invoice.</li>
            <li>2 · Bank transfers issue a proforma now; staff activate within one working day of clearing.</li>
            <li>3 · Paid verification fees open the case in the Verification Queue automatically.</li>
            <li>4 · Renewal reminders fire 30, 7 and 1 days before expiry.</li>
          </ol>
        </aside>
      </div>
    </>
  );
}
