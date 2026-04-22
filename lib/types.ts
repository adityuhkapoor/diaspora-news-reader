export type Source = {
  id: string;
  name: string;
  feedUrl: string;
  homepage: string;
};

export type Article = {
  id: string;
  sourceId: string;
  sourceName: string;
  title: string;
  link: string;
  publishedAt: string | null;
  snippet: string;
};

export type VocabItem = {
  tamil: string;
  transliteration: string;
  english: string;
  notes: string;
};

export type Summary = {
  articleId: string;
  englishSummary: string;
  vocabulary: VocabItem[];
  model: string;
  generatedAt: string;
};
