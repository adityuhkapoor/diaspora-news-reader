import { CohereClientV2 } from "cohere-ai";
import type { Summary, VocabItem } from "./types";

const MODEL = "c4ai-aya-expanse-32b";

let clientSingleton: CohereClientV2 | null = null;

function getClient(): CohereClientV2 {
  const token = process.env.COHERE_API_KEY;
  if (!token) {
    throw new Error("COHERE_API_KEY is not set. Copy .env.example to .env.local and fill it in.");
  }
  if (!clientSingleton) {
    clientSingleton = new CohereClientV2({ token });
  }
  return clientSingleton;
}

const SYSTEM_PROMPT = `You help a Tamil-heritage reader in the diaspora who understands some Tamil but not enough for dense news writing.

Given a Tamil article (title plus body excerpt), return a single JSON object with this exact shape:

{
  "englishSummary": "3 to 5 sentences in plain English covering who, what, where, and why it matters. Do not editorialize.",
  "vocabulary": [
    {
      "tamil": "Tamil word or short phrase from the article",
      "transliteration": "ISO 15919 style roman transliteration",
      "english": "translation in context",
      "notes": "one line on usage, register, or grammar worth knowing"
    }
  ]
}

Rules:
- Pick 6 vocabulary items: prefer the ones a learner actually needs to understand this specific story, not the most common words.
- Skip proper nouns (names, places) unless the word reveals something non-obvious about Tamil.
- Never invent Tamil script; only use words that appear in the article.
- Return JSON only. No prose before or after. No code fences.`;

function buildUserMessage(title: string, body: string): string {
  const trimmedBody = body.length > 4000 ? `${body.slice(0, 4000)}...` : body;
  return `Title: ${title}\n\nBody:\n${trimmedBody}`;
}

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Model did not return JSON. Raw output: ${trimmed.slice(0, 200)}`);
  }
  return JSON.parse(trimmed.slice(start, end + 1));
}

function coerceVocab(value: unknown): VocabItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const v = item as Record<string, unknown>;
    if (typeof v.tamil !== "string" || typeof v.english !== "string") return [];
    return [{
      tamil: v.tamil,
      transliteration: typeof v.transliteration === "string" ? v.transliteration : "",
      english: v.english,
      notes: typeof v.notes === "string" ? v.notes : "",
    }];
  });
}

export async function summarizeArticle(params: {
  articleId: string;
  title: string;
  body: string;
}): Promise<Summary> {
  const client = getClient();
  const response = await client.chat({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(params.title, params.body) },
    ],
    temperature: 0.3,
  });

  const contentBlocks = response.message?.content ?? [];
  const text = contentBlocks
    .map((block) => ("text" in block ? block.text : ""))
    .join("")
    .trim();

  if (!text) {
    throw new Error("Aya returned an empty response.");
  }

  const parsed = extractJson(text) as Record<string, unknown>;
  const englishSummary = typeof parsed.englishSummary === "string" ? parsed.englishSummary : "";
  const vocabulary = coerceVocab(parsed.vocabulary);

  if (!englishSummary) {
    throw new Error("Aya response missing englishSummary field.");
  }

  return {
    articleId: params.articleId,
    englishSummary,
    vocabulary,
    model: MODEL,
    generatedAt: new Date().toISOString(),
  };
}
