/**
 * Membership, pricing & service-fee model (spec §9).
 *
 * Every price, limit and toggle in this file is a DEFAULT only. The live copy
 * is a Mongo document (`settings.key = "pricing"`) edited from the Super
 * Admin console at /console/pricing — nothing on the public pages may read a
 * hard-coded price or limit. See src/lib/membership.js for the storage layer.
 *
 * Pure module: no db / next/cache imports, so the Super Admin form and the
 * public pages can share these constants safely.
 */

export const SETTINGS_KEY = "pricing";
export const TIER_KEYS = ["free", "silver", "gold", "platinum"];
export const PAID_TIERS = ["silver", "gold", "platinum"];

export const RANKING_OPTIONS = ["Standard", "Medium", "High", "Highest"];

export const BADGE_OPTIONS = [
  { value: "included", label: "Included" },
  { value: "paid_add_on", label: "Paid add-on" },
  { value: "none", label: "Not available" },
];

export const BADGE_LABELS = {
  included: "Included",
  paid_add_on: "Paid add-on",
  none: "Not available",
};

export const DEFAULT_PRICING = {
  billing: {
    cadence: "yearly",
    label: "billed yearly",
    periodLabel: "year",
  },
  tiers: [
    {
      key: "free",
      name: "Free",
      blurb: "For buyers and first-time suppliers testing the marketplace.",
      featured: false,
      priceUsd: 0,
      priceBdt: 0,
      foundingUsd: 0,
      foundingBdt: 0,
      limits: {
        productListingsUnlimited: false,
        productListings: 5,
        buyLeadAccess: "View only, contact hidden",
        directContactsPerDay: 2,
        searchRanking: "Standard",
        documentVerified: "paid_add_on",
        siteVerified: "paid_add_on",
        homepageBanner: false,
        dedicatedAccountManager: false,
        monthlyLeadReport: false,
      },
    },
    {
      key: "silver",
      name: "Silver",
      blurb: "For suppliers winning their first regular buyers.",
      featured: false,
      priceUsd: 249,
      priceBdt: 12000,
      foundingUsd: 125,
      foundingBdt: 6000,
      limits: {
        productListingsUnlimited: false,
        productListings: 25,
        buyLeadAccess: "After 48 hours",
        directContactsPerDay: 10,
        searchRanking: "Medium",
        documentVerified: "paid_add_on",
        siteVerified: "paid_add_on",
        homepageBanner: false,
        dedicatedAccountManager: false,
        monthlyLeadReport: false,
      },
    },
    {
      key: "gold",
      name: "Gold",
      blurb: "For active exporters running a full catalogue.",
      featured: true,
      priceUsd: 449,
      priceBdt: 25000,
      foundingUsd: 225,
      foundingBdt: 12500,
      limits: {
        productListingsUnlimited: false,
        productListings: 100,
        buyLeadAccess: "Instant",
        directContactsPerDay: 40,
        searchRanking: "High",
        documentVerified: "included",
        siteVerified: "paid_add_on",
        homepageBanner: false,
        dedicatedAccountManager: true,
        monthlyLeadReport: true,
      },
    },
    {
      key: "platinum",
      name: "Platinum",
      blurb: "For established suppliers who want every advantage.",
      featured: false,
      priceUsd: 749,
      priceBdt: 45000,
      foundingUsd: 375,
      foundingBdt: 22500,
      limits: {
        productListingsUnlimited: true,
        productListings: 100,
        buyLeadAccess: "12 hours before others",
        directContactsPerDay: 100,
        searchRanking: "Highest",
        documentVerified: "included",
        siteVerified: "included",
        homepageBanner: true,
        dedicatedAccountManager: true,
        monthlyLeadReport: true,
      },
    },
  ],
  founding: {
    enabled: true,
    totalSpots: 200,
    discountPercent: 50,
    headline: "First 200 paid members get 50% off their first year",
    counterLabel: "spots left",
  },
  guarantees: {
    moneyBackDays: 30,
    moneyBackAudience: "first-time paid members",
    leadGuaranteeEnabled: false,
    leadGuaranteeMinInquiries: 0,
    leadGuaranteeNote:
      "Free membership extension if a member receives fewer than the agreed number of verified inquiries in a month.",
  },
  trials: {
    silverTrialMonths: 3,
    eligibleCountry: "Bangladesh",
    note: "Selected Bangladeshi suppliers receive a free Silver trial before any billing starts.",
  },
  buyingMode: {
    note: "Buying mode is free on every tier: unlimited requirements and inquiries.",
  },
  serviceFees: [
    {
      key: "document_verified",
      name: "Document Verified",
      kind: "fixed",
      usd: 99,
      bdt: 5000,
      note: "",
    },
    {
      key: "site_verified_bd",
      name: "Site Verified (Bangladesh)",
      kind: "range_bdt",
      bdtMin: 8000,
      bdtMax: 10000,
      note: "",
    },
    {
      key: "audited",
      name: "Audited (third party)",
      kind: "custom",
      note: "Inspection agency cost + handling fee",
    },
    {
      key: "sourcing_desk",
      name: "Sourcing Desk",
      kind: "percent",
      percentMin: 3,
      percentMax: 5,
      minFeeUsd: 0,
      note: "with a minimum fee",
    },
    {
      key: "market_entry",
      name: "Bangladesh Market Entry",
      kind: "retainer",
      retainerUsdMin: 500,
      retainerUsdMax: 1500,
      salesPercentMin: 2,
      salesPercentMax: 5,
      note: "per month retainer",
    },
  ],
};

/* ------------------------------------------------------------------ *
 * Formatting
 * ------------------------------------------------------------------ */

const usdFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const bdtFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function formatUsd(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "Free";
  return `$${usdFormatter.format(amount)}`;
}

export function formatUsdRange(min, max) {
  if (min === max) return formatUsd(min);
  return `${formatUsd(min)}–${usdFormatter.format(Number(max) || 0)}`;
}

export function formatBdt(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "Free";
  return `BDT ${bdtFormatter.format(amount)}`;
}

/** "$449 / year" + "BDT 25,000" for a list or founding price. */
export function tierPriceLines(tier, { founding = false } = {}) {
  const usd = founding ? tier.foundingUsd : tier.priceUsd;
  const bdt = founding ? tier.foundingBdt : tier.priceBdt;
  if (!usd && !bdt) {
    return { usd: "Free", bdt: "Free forever", cadence: "" };
  }
  return {
    usd: formatUsd(usd),
    bdt: formatBdt(bdt),
    cadence: "/ year",
  };
}

/** Human label for a service fee, e.g. "$99 / BDT 5,000". */
export function serviceFeePrice(fee) {
  switch (fee.kind) {
    case "fixed":
      return `${formatUsd(fee.usd)} / ${formatBdt(fee.bdt)}`;
    case "range_bdt":
      return `BDT ${bdtFormatter.format(Number(fee.bdtMin) || 0)}–${bdtFormatter.format(
        Number(fee.bdtMax) || 0,
      )}`;
    case "percent": {
      const pct = `${Number(fee.percentMin) || 0}–${Number(fee.percentMax) || 0}% of deal value`;
      if (Number(fee.minFeeUsd) > 0) return `${pct}, minimum ${formatUsd(fee.minFeeUsd)}`;
      return fee.note ? `${pct}, ${fee.note}` : pct;
    }
    case "retainer":
      return `${formatUsdRange(fee.retainerUsdMin, fee.retainerUsdMax)}${
        fee.note ? ` ${fee.note}` : ""
      } + ${Number(fee.salesPercentMin) || 0}–${Number(fee.salesPercentMax) || 0}% of sales`;
    case "custom":
    default:
      return fee.note || "Quoted per engagement";
  }
}

/** Published price for a service fee key, or "Included" when there is none. */
export function feePriceByKey(settings, key) {
  if (!key) return "Included";
  const fee = settings.serviceFees.find((item) => item.key === key);
  return fee ? serviceFeePrice(fee) : "Included";
}

export function tierListingsLabel(tier) {
  return tier.limits.productListingsUnlimited
    ? "Unlimited"
    : String(tier.limits.productListings);
}

/* ------------------------------------------------------------------ *
 * Comparison table
 * ------------------------------------------------------------------ */

/** Rows of the public plan comparison, all read from live settings. */
export const FEATURE_ROWS = [
  {
    key: "listings",
    label: "Product listings",
    value: (tier) => tierListingsLabel(tier),
  },
  {
    key: "buyLead",
    label: "Buy lead access",
    value: (tier) => tier.limits.buyLeadAccess,
  },
  {
    key: "contacts",
    label: "Direct contacts per day",
    value: (tier) => String(tier.limits.directContactsPerDay),
  },
  {
    key: "ranking",
    label: "Search ranking",
    value: (tier) => tier.limits.searchRanking,
  },
  {
    key: "documentVerified",
    label: "Document Verified badge",
    value: (tier) => BADGE_LABELS[tier.limits.documentVerified] ?? "—",
  },
  {
    key: "siteVerified",
    label: "Site Verified (Bangladesh only)",
    value: (tier) => BADGE_LABELS[tier.limits.siteVerified] ?? "—",
  },
  {
    key: "homepageBanner",
    label: "Homepage banner",
    value: (tier) => (tier.limits.homepageBanner ? "Yes" : "No"),
  },
  {
    key: "accountManager",
    label: "Dedicated account manager",
    value: (tier) => (tier.limits.dedicatedAccountManager ? "Yes" : "No"),
  },
  {
    key: "leadReport",
    label: "Monthly lead report",
    value: (tier) => (tier.limits.monthlyLeadReport ? "Yes" : "No"),
  },
  {
    key: "buyingMode",
    label: "Buying mode (requirements & inquiries)",
    value: () => "Unlimited",
  },
];

/** Bullet highlights used on the plan cards. */
export function tierHighlights(tier) {
  const { limits } = tier;
  const highlights = [
    `${tierListingsLabel(tier)} product listings`,
    `Buy lead access: ${limits.buyLeadAccess}`,
    `${limits.directContactsPerDay} direct contacts / day`,
    `${limits.searchRanking} search ranking`,
  ];
  if (limits.documentVerified === "included") highlights.push("Document Verified included");
  if (limits.siteVerified === "included") highlights.push("Site Verified included");
  if (limits.homepageBanner) highlights.push("Homepage banner");
  if (limits.dedicatedAccountManager) highlights.push("Dedicated account manager");
  if (limits.monthlyLeadReport) highlights.push("Monthly lead report");
  return highlights;
}

/* ------------------------------------------------------------------ *
 * Normalisation — the only shape the database and UI ever see
 * ------------------------------------------------------------------ */

function toNumber(value, fallback, { min = 0, max = 1_000_000 } = {}) {
  if (value === null || value === undefined) return fallback;
  const text =
    typeof value === "number" ? String(value) : String(value).replace(/[,\s]/g, "");
  // Missing or non-numeric input keeps the default rather than collapsing to 0.
  if (text === "" || text === "-") return fallback;
  const parsed = Number(text);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function toText(value, fallback, max = 160) {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? text.slice(0, max) : fallback;
}

function toBool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1 || value === "1") return true;
  if (value === "false" || value === 0 || value === "0") return false;
  return fallback;
}

function oneOf(value, options, fallback) {
  return options.includes(value) ? value : fallback;
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeTier(raw, base) {
  const source = asObject(raw);
  const limits = asObject(source.limits);
  const baseLimits = base.limits;

  const priceUsd = toNumber(source.priceUsd, base.priceUsd, { max: 1_000_000 });
  const priceBdt = toNumber(source.priceBdt, base.priceBdt, { max: 100_000_000 });
  // A founding price is a discount — it can never exceed the list price.
  const foundingUsd = Math.min(
    priceUsd,
    toNumber(source.foundingUsd, base.foundingUsd, { max: 1_000_000 }),
  );
  const foundingBdt = Math.min(
    priceBdt,
    toNumber(source.foundingBdt, base.foundingBdt, { max: 100_000_000 }),
  );

  return {
    key: base.key,
    name: toText(source.name, base.name, 40),
    blurb: toText(source.blurb, base.blurb, 180),
    featured: toBool(source.featured, base.featured),
    priceUsd,
    priceBdt,
    foundingUsd: base.key === "free" ? 0 : foundingUsd,
    foundingBdt: base.key === "free" ? 0 : foundingBdt,
    limits: {
      productListingsUnlimited: toBool(
        limits.productListingsUnlimited,
        baseLimits.productListingsUnlimited,
      ),
      productListings: toNumber(limits.productListings, baseLimits.productListings, {
        max: 100_000,
      }),
      buyLeadAccess: toText(limits.buyLeadAccess, baseLimits.buyLeadAccess, 80),
      directContactsPerDay: toNumber(
        limits.directContactsPerDay,
        baseLimits.directContactsPerDay,
        { max: 100_000 },
      ),
      searchRanking: oneOf(limits.searchRanking, RANKING_OPTIONS, baseLimits.searchRanking),
      documentVerified: oneOf(
        limits.documentVerified,
        BADGE_OPTIONS.map((option) => option.value),
        baseLimits.documentVerified,
      ),
      siteVerified: oneOf(
        limits.siteVerified,
        BADGE_OPTIONS.map((option) => option.value),
        baseLimits.siteVerified,
      ),
      homepageBanner: toBool(limits.homepageBanner, baseLimits.homepageBanner),
      dedicatedAccountManager: toBool(
        limits.dedicatedAccountManager,
        baseLimits.dedicatedAccountManager,
      ),
      monthlyLeadReport: toBool(limits.monthlyLeadReport, baseLimits.monthlyLeadReport),
    },
  };
}

function normalizeServiceFee(raw, base) {
  const source = asObject(raw);
  const shared = {
    key: base.key,
    kind: base.kind,
    name: toText(source.name, base.name, 60),
    note: toText(source.note, base.note ?? "", 160),
  };

  switch (base.kind) {
    case "fixed":
      return {
        ...shared,
        usd: toNumber(source.usd, base.usd, { max: 100_000 }),
        bdt: toNumber(source.bdt, base.bdt, { max: 100_000_000 }),
      };
    case "range_bdt": {
      const bdtMin = toNumber(source.bdtMin, base.bdtMin, { max: 100_000_000 });
      return {
        ...shared,
        bdtMin,
        bdtMax: Math.max(bdtMin, toNumber(source.bdtMax, base.bdtMax, { max: 100_000_000 })),
      };
    }
    case "percent": {
      const percentMin = toNumber(source.percentMin, base.percentMin, { max: 100 });
      return {
        ...shared,
        percentMin,
        percentMax: Math.max(
          percentMin,
          toNumber(source.percentMax, base.percentMax, { max: 100 }),
        ),
        minFeeUsd: toNumber(source.minFeeUsd, base.minFeeUsd, { max: 1_000_000 }),
      };
    }
    case "retainer": {
      const retainerUsdMin = toNumber(source.retainerUsdMin, base.retainerUsdMin, {
        max: 1_000_000,
      });
      const salesPercentMin = toNumber(source.salesPercentMin, base.salesPercentMin, {
        max: 100,
      });
      return {
        ...shared,
        retainerUsdMin,
        retainerUsdMax: Math.max(
          retainerUsdMin,
          toNumber(source.retainerUsdMax, base.retainerUsdMax, { max: 1_000_000 }),
        ),
        salesPercentMin,
        salesPercentMax: Math.max(
          salesPercentMin,
          toNumber(source.salesPercentMax, base.salesPercentMax, { max: 100 }),
        ),
      };
    }
    default:
      return shared;
  }
}

/**
 * Coerce anything (form payload, stored doc, partial patch) into a complete,
 * safe settings object. Unknown input falls back to the defaults per field.
 */
export function normalizePricingSettings(raw) {
  const source = asObject(raw);
  const billing = asObject(source.billing);
  const founding = asObject(source.founding);
  const guarantees = asObject(source.guarantees);
  const trials = asObject(source.trials);
  const buyingMode = asObject(source.buyingMode);
  const rawTiers = Array.isArray(source.tiers) ? source.tiers : [];
  const rawFees = Array.isArray(source.serviceFees) ? source.serviceFees : [];

  const totalSpots = toNumber(founding.totalSpots, DEFAULT_PRICING.founding.totalSpots, {
    min: 1,
    max: 1_000_000,
  });

  const leadGuaranteeMinInquiries = toNumber(
    guarantees.leadGuaranteeMinInquiries,
    DEFAULT_PRICING.guarantees.leadGuaranteeMinInquiries,
    { max: 10_000 },
  );

  return {
    billing: {
      cadence: oneOf(billing.cadence, ["yearly"], DEFAULT_PRICING.billing.cadence),
      label: toText(billing.label, DEFAULT_PRICING.billing.label, 40),
      periodLabel: toText(billing.periodLabel, DEFAULT_PRICING.billing.periodLabel, 20),
    },
    tiers: TIER_KEYS.map((key, index) =>
      normalizeTier(rawTiers.find((tier) => asObject(tier).key === key) ?? rawTiers[index], {
        ...DEFAULT_PRICING.tiers[index],
        key,
      }),
    ),
    founding: {
      enabled: toBool(founding.enabled, DEFAULT_PRICING.founding.enabled),
      totalSpots,
      discountPercent: toNumber(
        founding.discountPercent,
        DEFAULT_PRICING.founding.discountPercent,
        { min: 0, max: 100 },
      ),
      headline: toText(founding.headline, DEFAULT_PRICING.founding.headline, 140),
      counterLabel: toText(founding.counterLabel, DEFAULT_PRICING.founding.counterLabel, 30),
    },
    guarantees: {
      moneyBackDays: toNumber(
        guarantees.moneyBackDays,
        DEFAULT_PRICING.guarantees.moneyBackDays,
        { min: 0, max: 365 },
      ),
      moneyBackAudience: toText(
        guarantees.moneyBackAudience,
        DEFAULT_PRICING.guarantees.moneyBackAudience,
        60,
      ),
      // Planned for after the first six months — off at launch.
      leadGuaranteeEnabled: toBool(
        guarantees.leadGuaranteeEnabled,
        DEFAULT_PRICING.guarantees.leadGuaranteeEnabled,
      ),
      leadGuaranteeMinInquiries,
      leadGuaranteeNote: toText(
        guarantees.leadGuaranteeNote,
        DEFAULT_PRICING.guarantees.leadGuaranteeNote,
        200,
      ),
    },
    trials: {
      silverTrialMonths: toNumber(
        trials.silverTrialMonths,
        DEFAULT_PRICING.trials.silverTrialMonths,
        { min: 0, max: 24 },
      ),
      eligibleCountry: toText(
        trials.eligibleCountry,
        DEFAULT_PRICING.trials.eligibleCountry,
        40,
      ),
      note: toText(trials.note, DEFAULT_PRICING.trials.note, 180),
    },
    buyingMode: {
      note: toText(buyingMode.note, DEFAULT_PRICING.buyingMode.note, 180),
    },
    serviceFees: DEFAULT_PRICING.serviceFees.map((base, index) =>
      normalizeServiceFee(
        rawFees.find((fee) => asObject(fee).key === base.key) ?? rawFees[index],
        base,
      ),
    ),
  };
}

/** Path diff (e.g. `tiers.1.priceUsd`) used for the audit entry on save. */
export function changedPaths(before, after, prefix = "") {
  const changed = [];

  if (Array.isArray(before) || Array.isArray(after)) {
    const previous = Array.isArray(before) ? before : [];
    const next = Array.isArray(after) ? after : [];
    const length = Math.max(previous.length, next.length);
    for (let index = 0; index < length; index += 1) {
      changed.push(...changedPaths(previous[index], next[index], `${prefix}.${index}`));
    }
    return changed;
  }

  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  for (const key of keys) {
    const path = prefix ? `${prefix}.${key}` : key;
    const previous = before?.[key];
    const next = after?.[key];
    const bothPlainObjects =
      previous &&
      next &&
      typeof previous === "object" &&
      typeof next === "object" &&
      !Array.isArray(previous) &&
      !Array.isArray(next);
    const bothArrays = Array.isArray(previous) && Array.isArray(next);
    if (bothPlainObjects || bothArrays) {
      changed.push(...changedPaths(previous, next, path));
    } else if (JSON.stringify(previous) !== JSON.stringify(next)) {
      changed.push(path);
    }
  }
  return changed;
}
