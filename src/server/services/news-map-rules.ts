import type { NewsItem, MarketImpact } from "@/types/news";
import type { MapEventSeverity, NewsMapEvent } from "@/types/map";

import { getRegionCoordinate } from "../providers/map/region-coordinates";

export const mapSeverityRank: Record<MapEventSeverity, number> = {
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

export function selectPrimaryRegion(
  item: NewsItem,
  unmappedTags: Set<string>,
) {
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

export function getGroupSeverity(regionTag: string, items: NewsItem[]) {
  const maxSeverity = items.reduce<MapEventSeverity>((currentMax, item) => {
    const severity = getMapSeverity(item);

    return mapSeverityRank[severity] > mapSeverityRank[currentMax]
      ? severity
      : currentMax;
  }, "low");

  if (regionTag !== "日本" || maxSeverity !== "high") {
    return maxSeverity;
  }

  const highCount = items.filter((item) => getMapSeverity(item) === "high").length;

  return highCount >= 2 || items.length === 1 ? "high" : "medium";
}

export function getRepresentativeItem(items: NewsItem[]) {
  const representativeItem = [...items].sort((itemA, itemB) => {
    const severityDiff =
      mapSeverityRank[getMapSeverity(itemB)] -
      mapSeverityRank[getMapSeverity(itemA)];

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

  if (!representativeItem) {
    throw new Error("代表ニュースを選定できませんでした。");
  }

  return representativeItem;
}

export function compareNewsMapEvents(
  eventA: NewsMapEvent,
  eventB: NewsMapEvent,
) {
  const severityDiff =
    mapSeverityRank[eventB.severity] - mapSeverityRank[eventA.severity];

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
