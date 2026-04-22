import fs from "node:fs/promises";
import path from "node:path";

const CACHE_DIR = path.join(process.cwd(), ".cache", "summaries");
const TTL_MS = 1000 * 60 * 60 * 24 * 7;

async function ensureDir(): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

function pathFor(key: string): string {
  return path.join(CACHE_DIR, `${key}.json`);
}

export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(pathFor(key), "utf8");
    const entry = JSON.parse(raw) as { savedAt: number; value: T };
    if (Date.now() - entry.savedAt > TTL_MS) return null;
    return entry.value;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, value: T): Promise<void> {
  await ensureDir();
  const entry = { savedAt: Date.now(), value };
  await fs.writeFile(pathFor(key), JSON.stringify(entry), "utf8");
}
