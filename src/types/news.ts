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

export type NewsSourceStatus = {
  id: string;
  name: string;
  status: "ok" | "error";
  itemCount: number;
  error?: string;
};

export type NewsResponse = {
  items: NewsItem[];
  fetchedAt: string;
  sources: string[];
  sourceStatuses: NewsSourceStatus[];
  partialFailure: boolean;
};
