import Link from "next/link";
import { notFound } from "next/navigation";
import { findArticle } from "@/lib/rss";
import { SummaryPanel } from "./summary-panel";

export const dynamic = "force-dynamic";

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await findArticle(id);
  if (!article) notFound();

  return (
    <article className="space-y-6">
      <nav className="text-sm">
        <Link href="/" className="text-stone-600 hover:text-stone-900">
          ← Back to headlines
        </Link>
      </nav>

      <header className="space-y-2">
        <div className="text-xs uppercase tracking-wide text-stone-500">{article.sourceName}</div>
        <h1 className="tamil text-2xl font-semibold leading-snug">{article.title}</h1>
        {article.snippet && (
          <p className="tamil text-base leading-relaxed text-stone-700">{article.snippet}</p>
        )}
        <a
          href={article.link}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-block text-sm text-stone-600 underline underline-offset-4 hover:text-stone-900"
        >
          Read the full article on {article.sourceName}
        </a>
      </header>

      <SummaryPanel articleId={article.id} />
    </article>
  );
}
