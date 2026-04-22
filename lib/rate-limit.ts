const WINDOW_MS = 5 * 60 * 1000;
const PER_IP_MAX = 10;
const DAILY_MAX = Number(process.env.SUMMARIZE_DAILY_MAX ?? 200);

const ipHits = new Map<string, number[]>();
let dayKey = "";
let dayCount = 0;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; reason: "ip" | "daily"; retryAfter: number };

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();

  if (today() !== dayKey) {
    dayKey = today();
    dayCount = 0;
  }
  if (dayCount >= DAILY_MAX) {
    const midnight = new Date();
    midnight.setUTCHours(24, 0, 0, 0);
    return { ok: false, reason: "daily", retryAfter: Math.ceil((midnight.getTime() - now) / 1000) };
  }

  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= PER_IP_MAX) {
    const oldest = hits[0];
    return { ok: false, reason: "ip", retryAfter: Math.ceil((WINDOW_MS - (now - oldest)) / 1000) };
  }
  hits.push(now);
  ipHits.set(ip, hits);
  return { ok: true };
}

export function recordPaidCall(): void {
  if (today() !== dayKey) {
    dayKey = today();
    dayCount = 0;
  }
  dayCount += 1;
}
