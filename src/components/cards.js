import Link from "next/link";
import { suppliers as allSuppliers } from "@/lib/catalog";
import { Badge } from "./ui";
import { StarIcon, CheckIcon } from "./icons";

function initials(name) {
  return name
    .split(" ")
    .filter((word) => word.length > 2)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function Media({ label, hs }) {
  return (
    <div className="grid-map relative flex h-32 items-end justify-between rounded-t-xl bg-gradient-to-br from-primary via-[#153050] to-[#1e4168] p-3">
      <span className="font-display text-2xl font-bold text-white/85">
        {label}
      </span>
      {hs ? (
        <span className="rounded bg-white/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">
          HS {hs}
        </span>
      ) : null}
    </div>
  );
}

export function ProductCard({ product }) {
  const supplier = allSuppliers.find((item) => item.slug === product.supplier);
  return (
    <Link
      href={`/products/${product.slug}`}
      className="panel group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <Media label={initials(product.name)} hs={product.hs} />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap gap-1.5">
          {product.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} tone="slate">
              {tag}
            </Badge>
          ))}
        </div>
        <h3 className="font-display text-[15px] font-bold leading-snug text-primary group-hover:underline">
          {product.name}
        </h3>
        <p className="text-[12px] text-slate-500">
          {supplier?.name} · {supplier?.city}
        </p>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
          <div>
            <span className="label-xs">Price</span>
            <p className="text-sm font-bold text-ink">
              {product.price}
              <span className="font-normal text-slate-500"> /{product.unit}</span>
            </p>
          </div>
          <div className="text-right">
            <span className="label-xs">MOQ</span>
            <p className="text-sm font-semibold text-ink">{product.moq}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function SupplierCard({ supplier }) {
  return (
    <Link
      href={`/suppliers/${supplier.slug}`}
      className="panel group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 font-display text-sm font-bold text-primary">
          {initials(supplier.name)}
        </span>
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 font-display text-[15px] font-bold text-primary group-hover:underline">
            <span className="truncate">{supplier.name}</span>
            <span aria-hidden="true" className="text-sm">
              {supplier.flag}
            </span>
          </h3>
          <p className="text-[12px] text-slate-500">
            {supplier.city}, {supplier.country} · Since {supplier.founded}
          </p>
        </div>
        <span className="ml-auto flex items-center gap-1 rounded-md bg-accent/20 px-2 py-1 text-[12px] font-bold text-accent-ink">
          <StarIcon className="h-3.5 w-3.5" />
          {supplier.rating}
        </span>
      </div>

      <p className="line-clamp-2 text-[13px] leading-6 text-slate-600">
        {supplier.desc}
      </p>

      <div className="flex flex-wrap gap-1.5">
        <Badge tone="green">
          <CheckIcon className="h-3 w-3" /> Verified
        </Badge>
        {supplier.badges.map((badge) => (
          <Badge key={badge} tone="navy">
            {badge}
          </Badge>
        ))}
      </div>

      {supplier.mainProducts ? (
        <p className="text-[12px] leading-5 text-slate-500">
          <span className="font-semibold text-ink">Main products:</span>{" "}
          {supplier.mainProducts.join(" · ")}
        </p>
      ) : null}

      <div className="mt-auto grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center text-[12px]">
        <div>
          <p className="font-bold text-ink">{supplier.products}</p>
          <p className="text-slate-500">Listings</p>
        </div>
        <div>
          <p className="font-bold text-ink">{supplier.responseRate}%</p>
          <p className="text-slate-500">Response</p>
        </div>
        <div>
          <p className="font-bold text-ink">{supplier.responseTime}</p>
          <p className="text-slate-500">Reply time</p>
        </div>
      </div>
    </Link>
  );
}

export function RequirementCard({ item }) {
  return (
    <Link
      href={`/requirements/${item.id}-${item.slug}`}
      className="panel group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2">
        <Badge tone={item.status === "Closing soon" ? "amber" : "green"}>
          {item.status}
        </Badge>
        <span className="text-[12px] text-slate-500">{item.id}</span>
      </div>
      <h3 className="font-display text-[15px] font-bold leading-snug text-primary group-hover:underline">
        {item.title}
      </h3>
      <p className="text-[13px] text-slate-600">
        {item.buyer} · {item.country}
      </p>
      <dl className="mt-auto grid grid-cols-2 gap-x-3 gap-y-2 border-t border-slate-100 pt-3 text-[12px]">
        <div>
          <dt className="text-slate-500">Quantity</dt>
          <dd className="font-semibold text-ink">{item.qty}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Closes</dt>
          <dd className="font-semibold text-ink">{item.deadline}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Budget</dt>
          <dd className="font-semibold text-ink">{item.budget}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Incoterm</dt>
          <dd className="font-semibold text-ink">{item.incoterm}</dd>
        </div>
      </dl>
    </Link>
  );
}
