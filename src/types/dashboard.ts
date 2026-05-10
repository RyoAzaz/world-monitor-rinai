export type MarketDirection = "up" | "down" | "flat";

export type MarketTicker = {
  id: string;
  label: string;
  value: string;
  change: string;
  direction: MarketDirection;
  updatedAt: string;
};

export type UsdJpyRateResponse = {
  ticker: MarketTicker;
  source: {
    name: string;
    url: string;
    dataDate: string;
    fetchedAt: string;
    note: string;
  };
};

export type NewsImpact = "高" | "中" | "低";

export type NewsItem = {
  id: string;
  headline: string;
  summary: string;
  source: string;
  region: string;
  category: string;
  impact: NewsImpact;
  publishedAt: string;
};

export type MapEvent = {
  id: string;
  title: string;
  country: string;
  coordinates: [number, number];
  severity: NewsImpact;
  category: string;
};
