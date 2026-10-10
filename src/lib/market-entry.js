import { db } from "./db";
import { cleanParagraph, cleanText, newRef, now } from "./refs";
import { ROLES } from "./permissions";

/**
 * Bangladesh Market Entry (spec §7.6).
 *
 *   1. Overseas company submits the application form (company, products,
 *      target segments, current markets).
 *   2. Staff screening.
 *   3. Call with AlliedOne leadership.
 *   4. Proposal and contract.
 *   5. Monthly retainer invoicing from the admin panel.
 *
 * Stage order below is the pipeline; every change is written to `stageHistory`
 * and audited by the server action that performs it.
 */

const APPLICATIONS = "market_entry_applications";

export const MARKET_ENTRY_STAGES = [
  { key: "submitted", label: "Application submitted" },
  { key: "screening", label: "Staff screening" },
  { key: "call", label: "Leadership call" },
  { key: "proposal", label: "Proposal issued" },
  { key: "contract", label: "Contract signed" },
  { key: "active", label: "Active — retainer billing" },
];

export const MARKET_ENTRY_TERMINAL = ["rejected", "withdrawn"];

export function stageLabel(key) {
  if (key === "rejected") return "Rejected";
  if (key === "withdrawn") return "Withdrawn";
  return MARKET_ENTRY_STAGES.find((stage) => stage.key === key)?.label || key;
}

export function stageIndex(key) {
  const index = MARKET_ENTRY_STAGES.findIndex((stage) => stage.key === key);
  return index === -1 ? MARKET_ENTRY_STAGES.length : index;
}

export async function submitMarketEntryApplication(email, input = {}) {
  const key = String(email || "").toLowerCase();
  if (!key) return { ok: false, error: "Sign in to submit an application." };

  const company = cleanText(input.company, 140);
  if (company.length < 2) return { ok: false, error: "Enter your company or brand name." };

  const details = cleanParagraph(input.details, 4000);
  if (details.length < 20) return { ok: false, error: "Describe what you want to source or launch." };

  const contactEmail = cleanText(input.email, 120).toLowerCase() || key;

  try {
    const existing = await db.collection(APPLICATIONS).findOne({
      email: key,
      stage: { $nin: ["rejected", "withdrawn"] },
    });
    if (existing) {
      return { ok: false, error: "You already have an application in progress." };
    }

    const at = now();
    const application = {
      id: newRef("ME"),
      email: key,
      company,
      website: cleanText(input.website, 160),
      category: cleanText(input.category, 80),
      targetMarket: cleanText(input.market, 80),
      products: cleanText(input.products, 400) || cleanText(input.details, 400),
      segments: cleanText(input.segments, 400),
      currentMarkets: cleanText(input.currentMarkets, 400),
      contactName: cleanText(input.name, 100),
      contactEmail,
      details,
      stage: "submitted",
      officer: "",
      note: "",
      stageHistory: [{ stage: "submitted", at, by: key }],
      createdAt: at,
      updatedAt: at,
    };
    await db.collection(APPLICATIONS).insertOne(application);
    return { ok: true, application };
  } catch (error) {
    console.error("[market-entry] submit failed", error.message);
    return { ok: false, error: "Could not submit the application." };
  }
}

export async function getApplicationFor(email) {
  const key = String(email || "").toLowerCase();
  if (!key) return null;
  try {
    return await db.collection(APPLICATIONS).findOne({ email: key }, { sort: { createdAt: -1 } });
  } catch (error) {
    console.error("[market-entry] read failed", error.message);
    return null;
  }
}

export async function listApplications({ stage, limit = 100 } = {}) {
  const filter = stage ? { stage } : {};
  try {
    return await db.collection(APPLICATIONS).find(filter).sort({ createdAt: -1 }).limit(limit).toArray();
  } catch (error) {
    console.error("[market-entry] list failed", error.message);
    return [];
  }
}

/** §7.6 steps 2–4 — staff advances the pipeline (audited by the caller). */
export async function advanceApplication(id, stage, actor, note = "") {
  const validStage = MARKET_ENTRY_STAGES.some((item) => item.key === stage) || MARKET_ENTRY_TERMINAL.includes(stage);
  if (!validStage) return { ok: false, error: "Unknown stage." };

  try {
    const application = await db.collection(APPLICATIONS).findOne({ id: String(id) });
    if (!application) return { ok: false, error: "Application not found." };

    const at = now();
    const result = await db.collection(APPLICATIONS).updateOne(
      { id: application.id },
      {
        $set: { stage, note: cleanText(note, 400) || application.note, updatedAt: at },
        $push: { stageHistory: { stage, at, by: actor } },
      },
    );
    return { ok: result.matchedCount === 1, stage };
  } catch (error) {
    console.error("[market-entry] advance failed", error.message);
    return { ok: false, error: "Could not update the stage." };
  }
}

export async function assignOfficer(id, officer, actor) {
  try {
    const result = await db.collection(APPLICATIONS).updateOne(
      { id: String(id) },
      { $set: { officer: cleanText(officer, 100), updatedAt: now(), updatedBy: actor } },
    );
    return { ok: result.matchedCount === 1 };
  } catch (error) {
    console.error("[market-entry] officer assign failed", error.message);
    return { ok: false };
  }
}

export async function listActiveForRetainer() {
  try {
    return await db.collection(APPLICATIONS).find({ stage: { $in: ["contract", "active"] } }).sort({ createdAt: 1 }).toArray();
  } catch (error) {
    console.error("[market-entry] active read failed", error.message);
    return [];
  }
}

/** Staff accounts that can be named as the market-entry officer. */
export async function listOfficers() {
  const staffRoles = [
    ROLES.STAFF_SUPPORT,
    ROLES.STAFF_SALES,
    ROLES.STAFF_VERIFIER,
    ROLES.VERIFICATION_PARTNER,
    ROLES.SUPER_ADMIN,
  ];
  try {
    return await db
      .collection("user")
      .find({ role: { $in: staffRoles } })
      .project({ email: 1, name: 1, role: 1 })
      .sort({ name: 1 })
      .toArray();
  } catch (error) {
    console.error("[market-entry] officers read failed", error.message);
    return [];
  }
}
