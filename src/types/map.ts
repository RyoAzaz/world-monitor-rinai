export type MapEventSeverity = "high" | "medium" | "low";

export type RegionCoordinate = {
  tag: string;
  label: string;
  coordinates: [number, number];
  kind: "country" | "region" | "organization";
};

export type NewsMapEvent = {
  id: string;
  title: string;
  regionTag: string;
  regionLabel: string;
  coordinates: [number, number];
  severity: MapEventSeverity;
  itemCount: number;
  source: "rss-news" | "mock";
  latestPublishedAt: string;
  topNewsTitle: string;
  topNewsUrl?: string;
  isRepresentativePoint: true;
};

export type NewsMapEventsResponse = {
  events: NewsMapEvent[];
  generatedAt: string;
  unmappedTags: string[];
  note: string;
};

export type NewsMapEventsErrorResponse = {
  error: string;
};
