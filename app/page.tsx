import Link from "next/link";
import { fetchAllArticles } from "@/lib/rss";

export const revalidate = 300;

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Home() {
  let articles;
  try {
    articles = await fetchAllArticles();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
        <p className="font-medium">Could not load feeds.</p>
        <p className="mt-1 text-red-800">{message}</p>
      </section>
    );
  }

  if (articles.length === 0) {
    return (
      <section className="rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-700">
        No articles in the feeds right now. Try again in a few minutes.
      </section>
    );
  }

  return (
    <section className="space-y-3">
      {articles.slice(0, 40).map((article) => (
        <Link
          key={article.id}
          href={`/article/${article.id}`}
          className="block rounded-lg border border-stone-200 bg-white p-4 transition hover:border-stone-400"
        >
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>{article.sourceName}</span>
            <span>{formatDate(article.publishedAt)}</span>
          </div>
          <h2 className="tamil mt-2 text-lg font-semibold leading-snug text-stone-900">
            {article.title}
          </h2>
          {article.snippet && (
            <p className="tamil mt-2 line-clamp-2 text-sm text-stone-600">{article.snippet}</p>
          )}
        </Link>
      ))}
    </section>
  );
}
