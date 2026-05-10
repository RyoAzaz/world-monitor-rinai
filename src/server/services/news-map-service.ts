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

const primaryRegionTagPriority = ["アジア", "ADB", "ASEAN", "G7", "G20", "IMF"];

const lowSeverityKeywords = [
  "採用",
  "職員募集",
  "職員を募集",
  "調達",
  "入札公告",
  "メンテナンス",
  "公告",
];

const mediumCapKeywords = [
  "流動性供給",
  "追加発行した国債の銘柄",
  "入札において",
];

const representativePenaltyKeywords = [
  ...lowSeverityKeywords,
  ...mediumCapKeywords,
];

const REPRESENTATIVE_POINT_NOTE =
  "地図上の点はニュースに関連する地域の代表点であり、正確な発生地点ではありません。";

export async function getNewsMapEvents(): Promise<NewsMapEventsResponse> {
  const news = await getLatestNews();
  const unmappedTags = new Set<string>();
  const groups = new Map<string, NewsMapGroup>();

  for (const item of news.items) {
    const region = selectPrimaryRegion(item, unmappedTags);

    if (!region) {
      continue;
    }

    const group = groups.get(region.tag) ?? {
      region,
      items: [],
    };

    group.items.push(item);
    groups.set(region.tag, group);
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
  const severity = getGroupSeverity(group);
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

function selectPrimaryRegion(
  item: NewsItem,
  unmappedTags: Set<string>,
): RegionCoordinate | null {
  const mappedRegions = item.regionTags.flatMap((tag) => {
    const region = getRegionCoordinate(tag);

    if (!region) {
      unmappedTags.add(tag);
      return [];
    }

    return [region];
  });

  for (const priorityTag of primaryRegionTagPriority) {
    const region = mappedRegions.find(
      (mappedRegion) => mappedRegion.tag === priorityTag,
    );

    if (region) {
      return region;
    }
  }

  return (
    mappedRegions.find((region) => region.tag !== "日本") ??
    mappedRegions.find((region) => region.tag === "日本") ??
    mappedRegions[0] ??
    null
  );
}

function getGroupSeverity(group: NewsMapGroup): MapEventSeverity {
  const maxSeverity = group.items.reduce<MapEventSeverity>((currentMax, item) => {
    const severity = getMapSeverity(item);

    return severityRank[severity] > severityRank[currentMax]
      ? severity
      : currentMax;
  }, "low");

  if (group.region.tag !== "日本" || maxSeverity !== "high") {
    return maxSeverity;
  }

  const highCount = group.items.filter(
    (item) => getMapSeverity(item) === "high",
  ).length;

  return highCount >= 2 || group.items.length === 1 ? "high" : "medium";
}

function getRepresentativeItem(items: NewsItem[]) {
  return [...items].sort((itemA, itemB) => {
    const severityDiff =
      severityRank[getMapSeverity(itemB)] -
      severityRank[getMapSeverity(itemA)];

    if (severityDiff !== 0) {
      return severityDiff;
    }

    const penaltyDiff =
      getRepresentativePenalty(itemA) - getRepresentativePenalty(itemB);

    if (penaltyDiff !== 0) {
      return penaltyDiff;
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

function getMapSeverity(item: NewsItem): MapEventSeverity {
  const text = getSearchableText(item);
  const baseSeverity = toMapEventSeverity(item.marketImpact);

  if (lowSeverityKeywords.some((keyword) => text.includes(keyword))) {
    return "low";
  }

  if (
    baseSeverity === "high" &&
    mediumCapKeywords.some((keyword) => text.includes(keyword))
  ) {
    return "medium";
  }

  return baseSeverity;
}

function getRepresentativePenalty(item: NewsItem) {
  return representativePenaltyKeywords.some((keyword) =>
    getSearchableText(item).includes(keyword),
  )
    ? 1
    : 0;
}

function getSearchableText(item: NewsItem) {
  return `${item.title} ${item.summary}`;
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
