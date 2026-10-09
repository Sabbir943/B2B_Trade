import { notFound } from "next/navigation";
import Link from "next/link";
import { categories, products, suppliers } from "@/lib/catalog";
import { shell } from "@/components/shell";
import { Badge, Button, Breadcrumbs, SectionTitle } from "@/components/ui";
import { ProductCard } from "@/components/cards";
import InquiryForm from "@/components/inquiry-form";
import { StarIcon } from "@/components/icons";

export const metadata = { title: "Product" };

export const instant = false;

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();

  const supplier = suppliers.find((item) => item.slug === product.supplier);
  const category = categories.find((item) => item.slug === product.category);
  const related = products
    .filter((item) => item.slug !== product.slug)
    .slice(0, 3);

  return (
    <section className={`py-7 sm:py-9 ${shell}`}>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Categories", href: "/categories" },
          { label: category?.name ?? "Products", href: `/categories/${product.category}` },
          { label: product.name },
        ]}
      />

      <div className="mt-5 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid-map flex h-56 items-end justify-between rounded-2xl bg-gradient-to-br from-primary via-[#153050] to-[#1e4168] p-5 sm:h-72">
            <div>
              <span className="label-xs text-white/60">{category?.name}</span>
              <p className="mt-1 max-w-md font-display text-xl font-bold leading-tight text-white sm:text-2xl">
                {product.name}
              </p>
            </div>
            <span className="rounded-lg bg-white/15 px-3 py-1 text-[12px] font-bold text-white">
              HS {product.hs}
            </span>
          </div>

          <div className="panel mt-5 p-5 sm:p-6">
            <p className="label-xs">Specification</p>
            <table className="mt-3 w-full text-sm">
              <tbody>
                {product.specs.map(([key, value]) => (
                  <tr key={key} className="border-b border-slate-100 last:border-0">
                    <th className="w-1/2 py-2.5 text-left font-medium text-slate-500">
                      {key}
                    </th>
                    <td className="py-2.5 font-semibold text-ink">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel mt-5 p-5 sm:p-6">
            <p className="label-xs">About this listing</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">{product.desc}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Badge key={tag} tone="navy">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mt-9">
            <SectionTitle eyebrow="Similar offers" title="Related listings" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <ProductCard key={item.slug} product={item} />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel sticky top-28 p-5">
            <p className="label-xs">Indicative price</p>
            <p className="mt-1 font-display text-2xl font-bold text-primary">
              {product.price}
              <span className="text-base font-semibold text-slate-500">
                {" "}
                / {product.unit}
              </span>
            </p>

            <dl className="mt-4 space-y-2.5 border-y border-slate-100 py-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Minimum order</dt>
                <dd className="font-semibold text-ink">{product.moq}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Lead time</dt>
                <dd className="font-semibold text-ink">{product.lead}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Loading port</dt>
                <dd className="font-semibold text-ink">{product.port}</dd>
              </div>
            </dl>

            {supplier ? (
              <Link
                href={`/suppliers/${supplier.slug}`}
                className="mt-4 flex items-start gap-3 rounded-xl bg-surface p-3 transition hover:bg-primary/5"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 font-display text-[13px] font-bold text-primary">
                  {supplier.name
                    .split(" ")
                    .slice(0, 2)
                    .map((word) => word[0])
                    .join("")}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {supplier.name}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2 text-[12px] text-slate-500">
                    <span className="flex items-center gap-1 text-secondary">
                      <StarIcon className="h-3.5 w-3.5" />
                      {supplier.rating}
                    </span>
                    · {supplier.responseRate}% response
                  </span>
                </span>
              </Link>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-3">
                <p className="text-[13px] font-semibold text-ink">
                  Supplier profile not published yet
                </p>
                <p className="mt-0.5 text-[12px] leading-5 text-slate-500">
                  The company behind this listing will be shown here once real
                  supplier data is connected.
                </p>
              </div>
            )}

            <div className="mt-4">
              <InquiryForm subject={product.name} compact />
            </div>

            <Button href="/rfq" variant="outline" size="sm" className="mt-3 w-full">
              Request a quote instead
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
