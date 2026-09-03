import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";

const EXTENSIONS = ["jpg", "jpeg", "webp", "png", "avif"] as const;
const cardsDir = path.join(process.cwd(), "public", "cards");
const cache = new Map<string, string>();

/**
 * Resolve the public URL of a slab photo for a catalog id, if one has been
 * exported to `public/cards/<id>.<ext>`. Hits are cached; misses are re-checked
 * so artwork dropped into the folder during `next dev` shows up on refresh.
 */
export function resolveCardImage(id: string): string | null {
  const cached = cache.get(id);
  if (cached) return cached;
  for (const ext of EXTENSIONS) {
    if (existsSync(path.join(cardsDir, `${id}.${ext}`))) {
      const url = `/cards/${id}.${ext}`;
      cache.set(id, url);
      return url;
    }
  }
  return null;
}
