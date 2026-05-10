export type MarketDirection = "up" | "down" | "flat";
export type MarketDataKind = "real" | "mock";

export type MarketTicker = {
  id: string;
  label: string;
  value: string;
  change: string;
  direction: MarketDirection;
  updatedAt: string;
  dataKind?: MarketDataKind;
  note?: string;
  priority?: number;
};

export type MarketDataSource = {
  name: string;
  url: string;
  dataDate: string;
  fetchedAt: string;
  note: string;
};

export type UsdJpyRateResponse = {
  ticker: MarketTicker;
  source: MarketDataSource;
};

export type Nasdaq100QuoteResponse = {
  ticker: MarketTicker;
  source: MarketDataSource;
};

export type Us10yYieldResponse = {
  ticker: MarketTicker;
  source: MarketDataSource;
};

export type VixIndexResponse = {
  ticker: MarketTicker;
  source: MarketDataSource;
};

export type FallbackImpactLevel = "高" | "中" | "低";

export type FallbackNewsItem = {
  id: string;
  headline: string;
  summary: string;
  source: string;
  region: string;
  category: string;
  impact: FallbackImpactLevel;
  publishedAt: string;
};

export type FallbackMapEvent = {
  id: string;
  title: string;
  country: string;
  coordinates: [number, number];
  severity: FallbackImpactLevel;
  category: string;
};
