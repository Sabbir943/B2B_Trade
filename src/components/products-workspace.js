"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge, Button, EmptyState } from "./ui";
import { BoxIcon, PlusIcon } from "./icons";
import { DataTable, Section, StatCards } from "./workspace";
import ListingForm from "./listing-form";
import { removeProductListing } from "@/lib/member-actions";

const STATUS_TONE = {
  approved: "green",
  pending: "amber",
  rejected: "red",
  draft: "slate",
};

const STATUS_LABEL = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
  draft: "Draft",
};

/**
 * §7.2 product listings workspace — live rows from MongoDB, tier allowance
 * banner, inline listing form and delete for draft/rejected rows.
 */
export default function ProductsWorkspace({
  listings = [],
  allowance = { unlimited: false, limit: 5, used: 0, remaining: 5, allowed: true },
  categories = [],
  currency = "USD",
  origin = "",
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(listings.length === 0);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);

  const approved = listings.filter((item) => item.status === "approved").length;
  const views = listings.reduce((sum, item) => sum + (item.views || 0), 0);
  const inquiries = listings.reduce((sum, item) => sum + (item.inquiries || 0), 0);

  const stats = [
    { label: "Live listings", value: String(approved), hint: `${listings.length} total` },
    { label: "Awaiting review", value: String(listings.filter((item) => item.status === "pending").length), hint: "12h moderation SLA" },
    { label: "Profile views", value: String(views), hint: "All time" },
    { label: "Inquiries", value: String(inquiries), hint: "All time" },
  ];

  async function handleDelete(id) {
    setDeleting(id);
    setError(null);
    const result = await removeProductListing(id);
    setDeleting(null);
    if (!result.ok) setError(result.error);
    else router.refresh();
  }

  return (
    <>
      <StatCards items={stats} />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-[13px] text-slate-600">
          Plan allowance:{" "}
          <strong className="text-ink">
            {allowance.unlimited ? "Unlimited listings" : `${allowance.used} of ${allowance.limit} active`}
          </strong>
        </p>
        <Button
          variant="navy"
          size="sm"
          onClick={() => setShowForm((value) => !value)}
          disabled={!allowance.allowed && !showForm}
        >
          {showForm ? "Hide form" : (<><PlusIcon className="h-4 w-4" /> Add product</>)}
        </Button>
      </div>

      {showForm ? (
        <div className="mt-4">
          <ListingForm
            categories={categories}
            currency={currency}
            origin={origin}
            onCancel={() => setShowForm(false)}
          />
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      ) : null}

      <Section className="mt-6" title="All listings">
        <DataTable
          columns={[
            {
              key: "title",
              label: "Product",
              emphasis: true,
              render: (row) => (
                <span className="flex flex-col gap-0.5">
                  <Link href={`/products/${row.id}`} className="hover:text-primary hover:underline">
                    {row.title}
                  </Link>
                  {row.rejectionReason ? (
                    <span className="text-[12px] font-normal text-red-600">
                      {row.rejectionReason}
                    </span>
                  ) : null}
                </span>
              ),
            },
            { key: "category", label: "Category" },
            { key: "moq", label: "MOQ" },
            {
              key: "price",
              label: "Price",
              render: (row) => (
                <span className="tabular-nums">
                  {row.currency || currency} {row.priceMin}
                  {row.priceMax && row.priceMax !== row.priceMin ? `–${row.priceMax}` : ""}
                </span>
              ),
            },
            { key: "views", label: "Views" },
            {
              key: "status",
              label: "Status",
              render: (row) => (
                <Badge tone={STATUS_TONE[row.status] || "slate"}>
                  {STATUS_LABEL[row.status] || row.status}
                </Badge>
              ),
            },
            {
              key: "actions",
              label: "",
              render: (row) =>
                ["draft", "rejected"].includes(row.status) ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(row.id)}
                    disabled={deleting === row.id}
                    className="whitespace-nowrap text-[11px] font-bold text-red-600 hover:underline disabled:opacity-50"
                  >
                    {deleting === row.id ? "Deleting…" : "Delete"}
                  </button>
                ) : null,
            },
          ]}
          rows={listings}
          empty="No listings yet."
        />
      </Section>

      {!listings.length ? (
        <div className="mt-6">
          <EmptyState
            icon={<BoxIcon className="h-5 w-5" />}
            title="Add your first product"
            text="List specs, MOQ, packing and certifications — complete listings rank higher in buyer search and get more inquiries."
            action={
              <Button variant="navy" size="sm" onClick={() => setShowForm(true)}>
                <PlusIcon className="h-4 w-4" /> Add product
              </Button>
            }
          />
        </div>
      ) : null}
    </>
  );
}
