import fs from "node:fs";
import path from "node:path";

/**
 * Resolves server-action ids from the dev build manifests.
 * ids are regenerated on every build, so the smoke scripts look them up
 * instead of hard-coding them.
 *
 *   const ids = findActionIds(["saveSiteContent", "suspendMember"]);
 */
function walk(directory, out = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name === "server-reference-manifest.json") out.push(full);
  }
  return out;
}

export function findActionIds(names) {
  const wanted = new Set(names);
  const found = {};
  for (const file of walk(".next")) {
    const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const [id, value] of Object.entries(manifest.node || {})) {
      if (wanted.has(value.exportedName) && !found[value.exportedName]) {
        found[value.exportedName] = id;
      }
    }
  }
  const missing = names.filter((name) => !found[name]);
  if (missing.length) {
    throw new Error(`action ids not found (run npm run dev first): ${missing.join(", ")}`);
  }
  return found;
}
