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

export const categoriesById = Object.fromEntries(
  categories.map((category) => [category.slug, category]),
);

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
