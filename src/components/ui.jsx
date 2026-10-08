import Link from "next/link";
import { shell } from "./shell";
import { ChevronRightIcon } from "./icons";

const badgeTones = {
  slate: "bg-slate-100 text-slate-600",
  navy: "bg-primary/10 text-primary",
  amber: "bg-accent/20 text-accent-ink",
  green: "bg-emerald-50 text-emerald-700",
  red: "bg-rose-50 text-rose-700",
  blue: "bg-sky-50 text-sky-700",
};

const buttonVariants = {
  accent:
    "bg-accent text-accent-ink hover:bg-accent-dark focus-visible:outline-accent",
  navy: "bg-primary text-white hover:bg-primary-dark focus-visible:outline-primary",
  outline:
    "border border-slate-300 bg-white text-ink hover:border-primary hover:text-primary focus-visible:outline-primary",
  ghost:
    "text-primary hover:bg-primary/5 focus-visible:outline-primary",
  white:
    "bg-white text-primary hover:bg-slate-100 focus-visible:outline-white",
  outlineWhite:
    "border border-white/50 bg-transparent text-white hover:bg-white/10 focus-visible:outline-white",
  soft: "bg-primary/8 text-primary hover:bg-primary/14 focus-visible:outline-primary",
};

const buttonSizes = {
  sm: "px-3 py-1.5 text-[13px]",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-[15px]",
};

export function Button({
  href,
  variant = "navy",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...props}>
      {children}
    </button>
  );
}

export function Badge({ children, tone = "slate", className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${badgeTones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Eyebrow({ children, className = "", dark = false }) {
  return (
    <div className={className}>
      <span className="eyebrow-rule" />
      <p
        className={`mt-3 text-[11px] font-bold uppercase tracking-[0.18em] sm:text-[12px] ${
          dark ? "text-white/70" : "text-primary"
        }`}
      >
        {children}
      </p>
    </div>
  );
}

export function Breadcrumbs({ items, dark = false }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[12px]">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-1.5">
          {i > 0 ? (
            <ChevronRightIcon
              className={`h-3.5 w-3.5 ${dark ? "text-white/40" : "text-slate-400"}`}
            />
          ) : null}
          {item.href ? (
            <Link
              href={item.href}
              className={`transition-colors hover:text-primary ${
                dark ? "text-white/60 hover:text-white" : "text-slate-500"
              }`}
            >
              {item.label}
            </Link>
          ) : (
            <span className={dark ? "text-white" : "font-medium text-ink"}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
  actions,
  children,
  dark = false,
  className = "",
}) {
  return (
    <section
      className={`${dark ? "bg-primary text-white" : "border-b border-slate-200/80 bg-white"} ${className}`}
    >
      <div className={`py-7 sm:py-9 ${shell}`}>
        {breadcrumbs ? (
          <div className="mb-4">
            <Breadcrumbs items={breadcrumbs} dark={dark} />
          </div>
        ) : null}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Eyebrow dark={dark}>{eyebrow}</Eyebrow>
            <h1
              className={`mt-3 font-display text-2xl font-bold leading-tight tracking-tight sm:text-[2rem] ${
                dark ? "text-white" : "text-primary"
              }`}
            >
              {title}
            </h1>
            {description ? (
              <p
                className={`mt-3 max-w-2xl text-[15px] leading-7 ${
                  dark ? "text-white/75" : "text-slate-600"
                }`}
              >
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap gap-3">{actions}</div>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}

export function SectionTitle({ eyebrow, title, action, className = "" }) {
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between ${className}`}
    >
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-2 font-display text-xl font-bold tracking-tight text-primary sm:text-2xl">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

export function Stat({ label, value, hint, tone = "navy" }) {
  const accent =
    tone === "amber"
      ? "bg-accent"
      : tone === "green"
        ? "bg-success"
        : tone === "red"
          ? "bg-danger"
          : "bg-primary";
  return (
    <div className="panel relative overflow-hidden p-4 sm:p-5">
      <span className={`absolute left-0 top-0 h-full w-1 ${accent}`} />
      <p className="label-xs">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight text-primary sm:text-[27px]">
        {value}
      </p>
      {hint ? <p className="mt-1 text-[12px] text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function ProgressBar({ value, tone = "navy" }) {
  const bar =
    tone === "amber" ? "bg-accent" : tone === "green" ? "bg-success" : "bg-primary";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full ${bar}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function Tabs({ items, active, className = "" }) {
  return (
    <div
      className={`no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 ${className}`}
    >
      {items.map((item) => {
        const isActive = item.label === active;
        const cls = `whitespace-nowrap rounded-lg px-3.5 py-2 text-[13px] font-semibold transition ${
          isActive
            ? "bg-primary text-white"
            : "text-slate-600 hover:bg-slate-50 hover:text-primary"
        }`;
        return item.href ? (
          <Link key={item.label} href={item.href} className={cls}>
            {item.label}
            {item.count !== undefined ? (
              <span className="ml-1.5 opacity-70">{item.count}</span>
            ) : null}
          </Link>
        ) : (
          <span key={item.label} className={cls}>
            {item.label}
            {item.count !== undefined ? (
              <span className="ml-1.5 opacity-70">{item.count}</span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

export function Field({ label, hint, required, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-center gap-1 text-[13px] font-semibold text-ink">
        {label}
        {required ? <span className="text-danger">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[12px] text-slate-500">{hint}</span> : null}
    </label>
  );
}

const controlCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 transition outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

export function Input(props) {
  return <input {...props} className={`${controlCls} ${props.className ?? ""}`} />;
}

export function Textarea(props) {
  return (
    <textarea
      rows={props.rows ?? 4}
      {...props}
      className={`${controlCls} resize-y ${props.className ?? ""}`}
    />
  );
}

export function Select(props) {
  return (
    <select {...props} className={`${controlCls} ${props.className ?? ""}`}>
      {props.children}
    </select>
  );
}

export function Avatar({ name, className = "", tone = "navy" }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const palette =
    tone === "amber"
      ? "bg-accent/20 text-accent-ink"
      : "bg-primary/10 text-primary";
  return (
    <span
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-[13px] font-bold ${palette} ${className}`}
    >
      {initials}
    </span>
  );
}

export function EmptyState({ title, text, action, icon }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center">
      {icon ? (
        <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-white text-primary shadow-sm">
          {icon}
        </span>
      ) : null}
      <h3 className="font-display text-base font-bold text-primary">{title}</h3>
      {text ? <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500">{text}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Panel({ children, className = "" }) {
  return <div className={`panel p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function CardGrid({ children, className = "" }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {children}
    </div>
  );
}
