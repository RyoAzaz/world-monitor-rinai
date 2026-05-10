export type MarketImpact = "high" | "medium" | "low";

export type NewsItem = {
  id: string;
  source: string;
  title: string;
  url: string;
  publishedAt: string;
  summary: string;
  regionTags: string[];
  marketImpact: MarketImpact;
};

export type NewsResponse = {
  items: NewsItem[];
  fetchedAt: string;
  sources: string[];
};
