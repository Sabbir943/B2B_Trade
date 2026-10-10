/**
 * Pure, dependency-free constants shared by server data modules and client
 * form components. Nothing here may import the database driver — client
 * components import from this file directly.
 */

export const INCOTERMS = ["EXW", "FCA", "FOB", "CFR", "CIF", "DAP", "DDP"];

/** §7.4.2 — pipeline stages shared by threads (client + server). */
export const THREAD_STAGES = ["New", "Negotiating", "Sampling", "Closed"];

/** §7.4.3 — banner shown when a thread trips the fraud scanner. */
export const FRAUD_BANNER_TEXT =
  "This conversation mentions bank or payment details. AlliedOne never asks you to change payment instructions by message — verify any new details by phone with a known contact before sending funds.";

export const BUSINESS_TYPES = [
  "Manufacturer",
  "Exporter",
  "Importer",
  "Trading company",
  "Distributor",
  "Buying house",
  "Cooperative",
  "Other",
];

export const TRADE_VOLUMES = [
  "Under $100k",
  "$100k – $500k",
  "$500k – $2M",
  "Over $2M",
];

/** §7.5 — document types accepted by the Verification Queue. */
export const DOCUMENT_TYPES = [
  "Trade licence / registration",
  "Tax ID",
  "Address proof",
  "Product certificates",
  "Bank letter",
  "Other",
];

/** §7.7 — bank-transfer details shown on the checkout proforma. */
export const BANK_DETAILS = {
  name: "AlliedOne Trade Hub",
  account: "AlliedOne Trade Hub Ltd.",
  bank: "City Bank PLC, Gulshan branch, Dhaka",
  accountNumber: "BD 0000 0000 0000 0000",
  swift: "CIBLBDDH",
  note: "Quote the proforma number as the payment reference.",
};
