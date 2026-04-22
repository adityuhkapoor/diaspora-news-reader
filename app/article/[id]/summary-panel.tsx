"use client";

import { useState } from "react";
import type { Summary } from "@/lib/types";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; summary: Summary; cached: boolean }
  | { kind: "error"; message: string };

export function SummaryPanel({ articleId }: { articleId: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function generate() {
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ articleId }),
      });
      const data = (await res.json()) as
        | { summary: Summary; cached: boolean }
        | { error: string };
      if (!res.ok || "error" in data) {
        setState({
          kind: "error",
          message: "error" in data ? data.error : `HTTP ${res.status}`,
        });
        return;
      }
      setState({ kind: "ready", summary: data.summary, cached: data.cached });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Request failed",
      });
    }
  }

  if (state.kind === "idle") {
    return (
      <section className="rounded-lg border border-stone-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-600">
          English summary + vocabulary
        </h2>
        <p className="mt-2 text-sm text-stone-700">
          Aya Expanse reads the Tamil, writes a plain English summary, and picks six words worth
          learning from this specific story.
        </p>
        <button
          onClick={generate}
          className="mt-4 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
        >
          Generate
        </button>
      </section>
    );
  }

  if (state.kind === "loading") {
    return (
      <section className="rounded-lg border border-stone-200 bg-white p-5 text-sm text-stone-600">
        Calling Aya Expanse…
      </section>
    );
  }

  if (state.kind === "error") {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-900">
        <p className="font-medium">Could not generate summary.</p>
        <p className="mt-1">{state.message}</p>
        <button
          onClick={generate}
          className="mt-3 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-900 hover:bg-red-100"
        >
          Retry
        </button>
      </section>
    );
  }

  const { summary, cached } = state;
  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-stone-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-600">
            English summary
          </h2>
          <span className="text-xs text-stone-500">
            {cached ? "cached" : summary.model}
          </span>
        </div>
        <p className="mt-3 text-base leading-relaxed text-stone-800">{summary.englishSummary}</p>
      </div>

      {summary.vocabulary.length > 0 && (
        <div className="rounded-lg border border-stone-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-600">
            Vocabulary in context
          </h2>
          <ul className="mt-3 divide-y divide-stone-100">
            {summary.vocabulary.map((item, i) => (
              <li key={`${item.tamil}-${i}`} className="py-3">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="tamil text-lg font-medium text-stone-900">{item.tamil}</span>
                  {item.transliteration && (
                    <span className="text-sm italic text-stone-500">{item.transliteration}</span>
                  )}
                  <span className="text-sm text-stone-700">— {item.english}</span>
                </div>
                {item.notes && (
                  <p className="mt-1 text-xs text-stone-500">{item.notes}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
