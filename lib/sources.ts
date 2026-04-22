import type { Source } from "./types";

export const SOURCES: Source[] = [
  {
    id: "bbc-tamil",
    name: "BBC Tamil",
    feedUrl: "https://feeds.bbci.co.uk/tamil/rss.xml",
    homepage: "https://www.bbc.com/tamil",
  },
  {
    id: "hindu-tamil",
    name: "Hindu Tamil Thisai",
    feedUrl: "https://www.hindutamil.in/news/rssfeed.xml",
    homepage: "https://www.hindutamil.in/",
  },
  {
    id: "dinamani",
    name: "Dinamani",
    feedUrl: "https://www.dinamani.com/rssfeed/?id=1065&getXmlFeed=true",
    homepage: "https://www.dinamani.com/",
  },
];

export function getSource(id: string): Source | undefined {
  return SOURCES.find((s) => s.id === id);
}
