import { readFile, stat } from "node:fs/promises";
import { NextResponse } from "next/server";
import path from "node:path";

/**
 * Serves images uploaded through /api/upload. Files live in `.uploads/`
 * (outside public/); the id is a random UUID so paths are unguessable and
 * there is no directory traversal (only `<uuid><known-ext>` is ever opened).
 */

const EXTENSIONS = [
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".gif", "image/gif"],
  [".svg", "image/svg+xml"],
];

export async function GET(_request, context) {
  const params = await context.params;
  const id = String(params?.id || "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const dir = path.join(process.cwd(), ".uploads");
  for (const [ext, type] of EXTENSIONS) {
    const file = path.join(dir, `${id}${ext}`);
    try {
      const info = await stat(file);
      if (!info.isFile()) continue;
      const body = await readFile(file);
      return new NextResponse(body, {
        headers: {
          "Content-Type": type,
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch {
      // try the next extension
    }
  }
  return new NextResponse("Not found", { status: 404 });
}
