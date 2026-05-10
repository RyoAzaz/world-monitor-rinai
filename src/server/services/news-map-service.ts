import type { NewsItem, MarketImpact } from "@/types/news";
import type {
  MapEventSeverity,
  NewsMapEvent,
  NewsMapEventsResponse,
  RegionCoordinate,
} from "@/types/map";

import { getRegionCoordinate } from "../providers/map/region-coordinates";
import { getLatestNews } from "./news-service";

type NewsMapGroup = {
  region: RegionCoordinate;
  items: NewsItem[];
};

const severityRank: Record<MapEventSeverity, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const REPRESENTATIVE_POINT_NOTE =
  "地図上の点はニュースに関連する地域の代表点であり、正確な発生地点ではありません。";

export async function getNewsMapEvents(): Promise<NewsMapEventsResponse> {
  const news = await getLatestNews();
  const unmappedTags = new Set<string>();
  const groups = new Map<string, NewsMapGroup>();

  for (const item of news.items) {
    const mappedTagsForItem = new Set<string>();

    for (const tag of item.regionTags) {
      const region = getRegionCoordinate(tag);

      if (!region) {
        unmappedTags.add(tag);
        continue;
      }

      if (mappedTagsForItem.has(region.tag)) {
        continue;
      }

      mappedTagsForItem.add(region.tag);

      const group = groups.get(region.tag) ?? {
        region,
        items: [],
      };

      group.items.push(item);
      groups.set(region.tag, group);
    }
  }

  return {
    events: Array.from(groups.values())
      .map(toNewsMapEvent)
      .sort(compareNewsMapEvents),
    generatedAt: new Date().toISOString(),
    unmappedTags: Array.from(unmappedTags).sort(),
    note: REPRESENTATIVE_POINT_NOTE,
  };
}

function toNewsMapEvent(group: NewsMapGroup): NewsMapEvent {
  const severity = getMaxSeverity(group.items);
  const representativeItem = getRepresentativeItem(group.items);
  const latestPublishedAt = getLatestPublishedAt(group.items);

  return {
    id: `news-map:${group.region.tag}`,
    title: `${group.region.label} 関連ニュース`,
    regionTag: group.region.tag,
    regionLabel: group.region.label,
    coordinates: group.region.coordinates,
    severity,
    itemCount: group.items.length,
    source: "rss-news",
    latestPublishedAt,
    topNewsTitle: representativeItem.title,
    topNewsUrl: representativeItem.url,
    isRepresentativePoint: true,
  };
}

function getMaxSeverity(items: NewsItem[]): MapEventSeverity {
  return items.reduce<MapEventSeverity>((maxSeverity, item) => {
    const severity = toMapEventSeverity(item.marketImpact);

    return severityRank[severity] > severityRank[maxSeverity]
      ? severity
      : maxSeverity;
  }, "low");
}

function getRepresentativeItem(items: NewsItem[]) {
  return [...items].sort((itemA, itemB) => {
    const severityDiff =
      severityRank[toMapEventSeverity(itemB.marketImpact)] -
      severityRank[toMapEventSeverity(itemA.marketImpact)];

    if (severityDiff !== 0) {
      return severityDiff;
    }

    return (
      new Date(itemB.publishedAt).getTime() -
      new Date(itemA.publishedAt).getTime()
    );
  })[0];
}

function getLatestPublishedAt(items: NewsItem[]) {
  return [...items].sort(
    (itemA, itemB) =>
      new Date(itemB.publishedAt).getTime() -
      new Date(itemA.publishedAt).getTime(),
  )[0].publishedAt;
}

function toMapEventSeverity(impact: MarketImpact): MapEventSeverity {
  return impact;
}

function compareNewsMapEvents(eventA: NewsMapEvent, eventB: NewsMapEvent) {
  const severityDiff = severityRank[eventB.severity] - severityRank[eventA.severity];

  if (severityDiff !== 0) {
    return severityDiff;
  }

  if (eventB.itemCount !== eventA.itemCount) {
    return eventB.itemCount - eventA.itemCount;
  }

  return (
    new Date(eventB.latestPublishedAt).getTime() -
    new Date(eventA.latestPublishedAt).getTime()
  );
}
