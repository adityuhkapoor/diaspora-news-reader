import { NextResponse } from "next/server";
import { findArticle } from "@/lib/rss";
import { readCache, writeCache } from "@/lib/cache";
import { summarizeArticle } from "@/lib/cohere";
import { checkRateLimit, recordPaidCall } from "@/lib/rate-limit";
import type { Summary } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  const rl = checkRateLimit(clientIp(request));
  if (!rl.ok) {
    return NextResponse.json(
      { error: rl.reason === "daily" ? "Daily limit reached" : "Too many requests" },
      { status: 429, headers: { "retry-after": String(rl.retryAfter) } },
    );
  }

  let articleId: string;
  try {
    const body = (await request.json()) as { articleId?: string };
    if (!body.articleId) {
      return NextResponse.json({ error: "articleId is required" }, { status: 400 });
    }
    articleId = body.articleId;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const cached = await readCache<Summary>(articleId);
  if (cached) {
    return NextResponse.json({ summary: cached, cached: true });
  }

  const article = await findArticle(articleId);
  if (!article) {
    return NextResponse.json({ error: "Article not found in current feeds" }, { status: 404 });
  }

  try {
    const summary = await summarizeArticle({
      articleId,
      title: article.title,
      body: article.snippet || article.title,
    });
    recordPaidCall();
    await writeCache(articleId, summary);
    return NextResponse.json({ summary, cached: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
