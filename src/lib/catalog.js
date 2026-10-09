export const siteStats = {
  enabled: true,
  lines: [
    "260+ suppliers in our sourcing network",
    "Supplier network across 25 countries",
    "14+ years of leadership experience in international trade",
  ],
};

export const categories = [
  {
    slug: "spices",
    name: "Spices & Seasonings",
    hs: "0910",
    blurb: "Turmeric, chilli, cumin, cardamom and blended seasonings.",
    sub: ["Turmeric", "Chilli & Paprika", "Cumin & Coriander", "Cardamom", "Blended Masala"],
  },
  {
    slug: "agro-products",
    name: "Agro Products",
    hs: "1006",
    blurb: "Rice, pulses, oilseeds and processed agricultural goods.",
    sub: ["Basmati & Non-Basmati Rice", "Pulses", "Oilseeds", "Tea & Spices"],
  },
  {
    slug: "textile-garment-accessories",
    name: "Textile & Garment Accessories",
    hs: "5806",
    blurb: "Labels, elastics, tapes, trims and packaging for apparel.",
    sub: ["Woven Labels", "Elastics & Tapes", "Buttons & Zips", "Packaging"],
  },
  {
    slug: "home-textiles",
    name: "Home Textiles",
    hs: "6302",
    blurb: "Bed linen, towels, throws and kitchen textiles.",
    sub: ["Bedding", "Towels", "Throws & Covers"],
  },
  {
    slug: "leather-footwear",
    name: "Leather & Footwear",
    hs: "6403",
    blurb: "Finished leather, shoes, boots and components.",
    sub: ["Finished Leather", "Casual Footwear", "Safety Footwear"],
  },
  {
    slug: "jute-products",
    name: "Jute & Jute Products",
    hs: "5303",
    blurb: "Sacks, geotextiles, yarn and eco packaging.",
    sub: ["Hessian Goods", "Jute Yarn", "Geo Textiles"],
  },
  {
    slug: "plastics-packaging",
    name: "Plastics & Packaging",
    hs: "3923",
    blurb: "Flexible films, rigid containers and printed packaging.",
    sub: ["Films & Sheets", "Containers", "Printed Packaging"],
  },
  {
    slug: "chemicals",
    name: "Chemicals",
    hs: "2915",
    blurb: "Industrial, textile and specialty chemicals.",
    sub: ["Industrial Chemicals", "Textile Auxiliaries", "Specialty Chemicals"],
  },
  {
    slug: "pharmaceuticals",
    name: "Pharmaceuticals",
    hs: "3004",
    blurb: "Finished formulations, APIs and herbal extracts.",
    sub: ["Finished Formulations", "APIs", "Herbal Extracts"],
  },
  {
    slug: "engineering-goods",
    name: "Engineering Goods",
    hs: "8483",
    blurb: "Machined parts, hardware, and light machinery.",
    sub: ["Machined Parts", "Fasteners", "Light Machinery"],
  },
  {
    slug: "construction-raw-materials",
    name: "Construction Raw Materials",
    hs: "2523",
    blurb: "Cement, aggregates, steel sections and fittings.",
    sub: ["Cement & Lime", "Steel Sections", "Fittings"],
  },
  {
    slug: "feed-ingredients",
    name: "Feed Ingredients",
    hs: "2309",
    blurb: "Meal, by-products and additive feed ingredients.",
    sub: ["Meals & By-products", "Additives"],
  },
];

export const suppliers = [];

export const products = [];

export const requirements = [];

export const insights = [
  {
    slug: "freight-rates-q4-2026",
    title: "Freight rates into North Europe: what Q4 2026 looks like",
    category: "Logistics",
    date: "02 Oct 2026",
    read: "6 min",
    author: "AlliedOne Research",
    excerpt:
      "Slot availability, reefer demand and carrier schedule reliability are moving in different directions. Here is how buyers are locking rates this quarter.",
  },
  {
    slug: "hs-code-classification-guide",
    title: "Getting HS codes right the first time",
    category: "Compliance",
    date: "24 Sep 2026",
    read: "8 min",
    author: "Sadia Karim",
    excerpt:
      "Misclassified lines are the fastest route to customs delays. A practical walk-through of headings, notes and binding rulings.",
  },
  {
    slug: "packing-lists-that-clear-customs",
    title: "Packing lists that clear customs without a query",
    category: "Documentation",
    date: "11 Sep 2026",
    read: "5 min",
    author: "Imran Hossain",
    excerpt:
      "The seven fields that most often trigger a hold, and the templates our members use to avoid them.",
  },
  {
    slug: "buyer-sourcing-from-bangladesh",
    title: "How European buyers are reworking Bangladesh sourcing",
    category: "Sourcing",
    date: "29 Aug 2026",
    read: "7 min",
    author: "AlliedOne Research",
    excerpt:
      "Lead times, dual-sourcing and compliance checks are reshaping order books. Data from 400 buyer accounts.",
  },
];

export const hsCodes = [
  { code: "0910", title: "Turmeric, chilli and other spices" },
  { code: "1006", title: "Rice" },
  { code: "5806", title: "Narrow woven fabrics and trims" },
  { code: "5303", title: "Jute and other textile bast fibres" },
  { code: "6403", title: "Footwear with outer soles of rubber or plastics" },
  { code: "3923", title: "Plastic plates, sheets and self-wrapping films" },
];

// Membership tiers (Free / Silver / Gold / Platinum) live in
// src/lib/pricing.js and are edited from /console/pricing — never here.

export const dashboard = {
  user: { name: "Nadia Rahman", company: "Meridian Spice Exports", role: "Export Manager" },
  stats: [
    { label: "Profile views", value: "4,182", hint: "+12% vs last 30 days" },
    { label: "New inquiries", value: "37", hint: "9 awaiting reply" },
    { label: "Active listings", value: "64", hint: "6 drafts" },
    { label: "Matched leads", value: "18", hint: "5 closing this week" },
  ],
  products: [
    { name: "Turmeric Finger, Curcumin 3–5%", sku: "SPC-TUR-041", category: "Spices", views: "1,204", inquiries: 14, status: "Live" },
    { name: "Basmati Rice 1121, Raw", sku: "AGR-BAS-112", category: "Agro", views: "2,881", inquiries: 22, status: "Live" },
    { name: "Chilli Powder, 1000 SHU", sku: "SPC-CHL-018", category: "Spices", views: "640", inquiries: 4, status: "Draft" },
    { name: "Cumin Seed, 99% purity", sku: "SPC-CUM-077", category: "Spices", views: "0", inquiries: 0, status: "In review" },
  ],
  requirements: [
    { id: "RQ-2477", title: "Parboiled rice, 5% broken", qty: "960 MT", quotes: 7, status: "Open", deadline: "22 Oct 2026" },
    { id: "RQ-2441", title: "Ground cumin, 5 MT monthly", qty: "5 MT", quotes: 3, status: "Awarded", deadline: "05 Oct 2026" },
    { id: "RQ-2422", title: "PP woven sacks, 50 kg", qty: "80,000 pcs", quotes: 11, status: "Closed", deadline: "28 Sep 2026" },
  ],
  inquiries: [
    { from: "Kontor Handels GmbH", country: "Germany", subject: "Turmeric finger — 20 t trial order", time: "12 min ago", unread: true, stage: "New" },
    { from: "Vandermeer Retail BV", country: "Netherlands", subject: "Care label programme update", time: "2 hrs ago", unread: true, stage: "Negotiating" },
    { from: "Gulf Grain Trading LLC", country: "UAE", subject: "Basmati 1121 — CFR Jebel Ali", time: "Yesterday", unread: false, stage: "Sampling" },
    { from: "Ironpath Safety Ltd.", country: "UK", subject: "Chrome-free upper samples", time: "2 days ago", unread: false, stage: "Closed" },
  ],
  leads: [
    { title: "Buyer seeking turmeric oleoresin", match: 94, country: "Poland", value: "$ 46k", stage: "New" },
    { title: "Monthly rice programme, 300 MT", match: 88, country: "Qatar", value: "$ 310k", stage: "Quoted" },
    { title: "Woven label RFP for workwear", match: 81, country: "France", value: "$ 72k", stage: "Sampling" },
    { title: "Jute sack supplier, coffee sector", match: 74, country: "Italy", value: "$ 28k", stage: "New" },
  ],
  invoices: [
    { id: "INV-2026-0918", plan: "Exporter — Annual", issued: "01 Oct 2026", amount: "$1,490.00", status: "Paid" },
    { id: "INV-2026-0812", plan: "Exporter — Annual", issued: "01 Oct 2025", amount: "$1,490.00", status: "Paid" },
    { id: "INV-2026-1004", plan: "Featured listing add-on", issued: "05 Oct 2026", amount: "$89.00", status: "Due" },
  ],
  verifySteps: [
    { label: "Application submitted", state: "done", date: "18 Sep 2026" },
    { label: "Documents reviewed", state: "done", date: "22 Sep 2026" },
    { label: "Factory audit scheduled", state: "current", date: "14 Oct 2026" },
    { label: "Audit report in review", state: "todo", date: "—" },
    { label: "Certificate issued", state: "todo", date: "—" },
  ],
};

export const admin = {
  members: [
    { id: "MB-10482", company: "Meridian Spice Exports", plan: "Exporter", country: "Bangladesh", joined: "12 Mar 2024", status: "Active" },
    { id: "MB-10477", company: "Harborline Textiles Ltd.", plan: "Exporter", country: "Bangladesh", joined: "04 Mar 2024", status: "Active" },
    { id: "MB-10461", company: "Kontor Handels GmbH", plan: "Trader", country: "Germany", joined: "27 Feb 2024", status: "Active" },
    { id: "MB-10455", company: "Gulf Grain Trading LLC", plan: "Trader", country: "UAE", joined: "19 Feb 2024", status: "Suspended" },
    { id: "MB-10442", company: "Atrium Leather Co.", plan: "Starter", country: "Bangladesh", joined: "02 Feb 2024", status: "Pending" },
  ],
  queue: [
    { id: "CS-3310", company: "Delta Jute Works", type: "Company", submitted: "06 Oct 2026", age: "2 d", risk: "Low" },
    { id: "CS-3309", company: "Northstar Chem Industries", type: "Documents", submitted: "05 Oct 2026", age: "3 d", risk: "Medium" },
    { id: "CS-3305", company: "Atrium Leather Co.", type: "Factory audit", submitted: "03 Oct 2026", age: "5 d", risk: "Low" },
    { id: "CS-3298", company: "Sunrise Agro Traders", type: "Company", submitted: "01 Oct 2026", age: "7 d", risk: "High" },
  ],
  listings: [
    { id: "LS-8871", product: "Turmeric Finger, Curcumin 3–5%", seller: "Meridian Spice Exports", flag: "Price claim", reported: "05 Oct 2026", status: "Under review" },
    { id: "LS-8864", product: "PE Flexible Packaging Films", seller: "Delta Pack Solutions", flag: "Image rights", reported: "03 Oct 2026", status: "Under review" },
    { id: "LS-8852", product: "Cotton polo knit programme", seller: "Harborline Textiles Ltd.", flag: "Duplicate", reported: "01 Oct 2026", status: "Approved" },
  ],
  leads: [
    { id: "LD-5540", title: "Turmeric oleoresin, EU buyer", routed: "Meridian Spice Exports", value: "$46k", quality: "Warm", status: "Routed" },
    { id: "LD-5537", title: "Parboiled rice programme", routed: "Awaiting routing", value: "$310k", quality: "Hot", status: "Needs action" },
    { id: "LD-5529", title: "Woven label RFP", routed: "Harborline Textiles Ltd.", value: "$72k", quality: "Warm", status: "Routed" },
  ],
  inquiries: [
    { id: "IQ-2291", parties: "Kontor Handels ↔ Meridian Spice", reason: "Pricing outside band", time: "07 Oct 2026", status: "Flagged" },
    { id: "IQ-2284", parties: "Gulf Grain ↔ Delta Jute", reason: "Off-platform payment", time: "05 Oct 2026", status: "Escalated" },
    { id: "IQ-2277", parties: "Ironpath ↔ Atrium Leather", reason: "Repeated no-response", time: "02 Oct 2026", status: "Reviewed" },
  ],
  payments: [
    { id: "INV-2026-0918", member: "Meridian Spice Exports", amount: "$1,490.00", method: "Card", date: "01 Oct 2026", status: "Paid" },
    { id: "INV-2026-0917", member: "Harborline Textiles Ltd.", amount: "$1,490.00", method: "Wire", date: "01 Oct 2026", status: "Paid" },
    { id: "INV-2026-1004", member: "Delta Pack Solutions", amount: "$89.00", method: "Card", date: "05 Oct 2026", status: "Failed" },
    { id: "INV-2026-1006", member: "Gulf Grain Trading LLC", amount: "$49.00", method: "Card", date: "06 Oct 2026", status: "Refunded" },
  ],
  applications: [
    { id: "ME-118", company: "Sunrise Agro Traders", market: "EU — Germany", submitted: "04 Oct 2026", stage: "Documents", officer: "R. Chowdhury" },
    { id: "ME-115", company: "Delta Jute Works", market: "GCC — UAE", submitted: "29 Sep 2026", stage: "Interview", officer: "S. Karim" },
    { id: "ME-112", company: "Atrium Leather Co.", market: "UK", submitted: "21 Sep 2026", stage: "Approved", officer: "R. Chowdhury" },
  ],
  content: [
    { id: "CMS-402", item: "Freight rates into North Europe: Q4 2026", type: "Article", updated: "02 Oct 2026", status: "Published" },
    { id: "CMS-399", item: "Featured category — Spices", type: "Category", updated: "30 Sep 2026", status: "Published" },
    { id: "CMS-395", item: "Membership pricing page", type: "Page", updated: "26 Sep 2026", status: "Draft" },
  ],
  roles: [
    { role: "Super Admin", members: 2, scope: "Full console, billing, audit", mfa: "Required" },
    { role: "Verification Officer", members: 6, scope: "Verification queue, audits", mfa: "Required" },
    { role: "Listing Moderator", members: 9, scope: "Listings, reports", mfa: "Required" },
    { role: "Support Agent", members: 12, scope: "Inquiries, member support", mfa: "Optional" },
    { role: "Finance", members: 3, scope: "Payments, invoices, refunds", mfa: "Required" },
  ],
  reports: [
    { label: "Members onboarded", value: "312", period: "Last 30 days" },
    { label: "Listings moderated", value: "1,948", period: "Last 30 days" },
    { label: "Median review time", value: "9 hrs", period: "Target 24 hrs" },
    { label: "Flagged inquiries", value: "27", period: "Last 30 days" },
  ],
};

export const console_ = {
  revenue: [
    { month: "May", value: 74 },
    { month: "Jun", value: 81 },
    { month: "Jul", value: 88 },
    { month: "Aug", value: 92 },
    { month: "Sep", value: 104 },
    { month: "Oct", value: 118 },
  ],
  stats: [
    { label: "MRR", value: "$118.4k", hint: "+13.5% MoM" },
    { label: "ARR run-rate", value: "$1.42M", hint: "Net of refunds" },
    { label: "Paid members", value: "1,847", hint: "71% on annual" },
    { label: "Churn (logo)", value: "2.4%", hint: "-0.6 pts QoQ" },
  ],
  offers: [
    { code: "TRADEFEST26", type: "25% off first year", uses: "184 / 500", expires: "31 Dec 2026", status: "Live" },
    { code: "CHAMBER-DH", type: "Member rate −20%", uses: "62 / 300", expires: "31 Mar 2027", status: "Live" },
    { code: "Q4EXPORTER", type: "3 months free", uses: "0 / 200", expires: "Not started", status: "Paused" },
  ],
  desk: [
    { id: "SD-771", lead: "Basmati rice 1,200 MT — 3 destinations", owner: "Desk A · R. Chowdhury", value: "$1.2M", sla: "4 hrs left", status: "Routing" },
    { id: "SD-768", lead: "Pharma API sourcing — 4 NCEs", owner: "Desk B · S. Karim", value: "$310k", sla: "1 day left", status: "Matching" },
    { id: "SD-764", lead: "Jute sack framework — coffee co-op", owner: "Desk A · I. Hossain", value: "$95k", sla: "Met", status: "Matched" },
  ],
  audit: [
    { time: "08 Oct 2026 09:41", actor: "s.karim@alliedone", action: "pricing.tier.update", target: "Exporter floor → $119/mo", ip: "103.108.44.12" },
    { time: "08 Oct 2026 08:12", actor: "system", action: "billing.retry", target: "INV-2026-1004", ip: "—" },
    { time: "07 Oct 2026 19:55", actor: "r.chowdhury@alliedone", action: "member.suspend", target: "MB-10455", ip: "103.108.44.9" },
    { time: "07 Oct 2026 16:03", actor: "admin@alliedone", action: "offer.create", target: "TRADEFEST26", ip: "10.10.2.4" },
    { time: "07 Oct 2026 11:20", actor: "i.hossain@alliedone", action: "desk.lead.route", target: "SD-764", ip: "103.108.44.31" },
  ],
};
