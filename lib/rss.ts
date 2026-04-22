import Parser from "rss-parser";
import crypto from "node:crypto";
import { SOURCES } from "./sources";
import type { Article, Source } from "./types";

const parser = new Parser({
  timeout: 10_000,
  headers: { "User-Agent": "diaspora-news-reader/0.1 (+portfolio)" },
});

function articleId(sourceId: string, link: string): string {
  return crypto.createHash("sha1").update(`${sourceId}::${link}`).digest("hex").slice(0, 16);
}

function stripHtml(input: string | undefined): string {
  if (!input) return "";
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchSource(source: Source): Promise<Article[]> {
  const feed = await parser.parseURL(source.feedUrl);
  const items = feed.items ?? [];
  return items
    .filter((item) => item.link && item.title)
    .map((item) => {
      const link = item.link as string;
      return {
        id: articleId(source.id, link),
        sourceId: source.id,
        sourceName: source.name,
        title: (item.title ?? "").trim(),
        link,
        publishedAt: item.isoDate ?? item.pubDate ?? null,
        snippet: stripHtml(item.contentSnippet ?? item.content ?? ""),
      };
    });
}

export async function fetchAllArticles(): Promise<Article[]> {
  const results = await Promise.allSettled(SOURCES.map(fetchSource));
  const articles: Article[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      articles.push(...r.value);
    } else {
      console.warn("RSS fetch failed:", r.reason instanceof Error ? r.reason.message : r.reason);
    }
  }
  articles.sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });
  return articles;
}

export async function findArticle(id: string): Promise<Article | undefined> {
  const all = await fetchAllArticles();
  return all.find((a) => a.id === id);
}
