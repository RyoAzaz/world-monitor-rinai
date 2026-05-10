import type { NewsItem } from "@/types/news";
import type {
  NewsMapEvent,
  NewsMapEventsResponse,
  RegionCoordinate,
} from "@/types/map";

import { getLatestNews } from "./news-service";
import {
  compareNewsMapEvents,
  getGroupSeverity,
  getRepresentativeItem,
  selectPrimaryRegion,
} from "./news-map-rules";

type NewsMapGroup = {
  region: RegionCoordinate;
  items: NewsItem[];
};

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
  const severity = getGroupSeverity(group.region.tag, group.items);
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

function getLatestPublishedAt(items: NewsItem[]) {
  return [...items].sort(
    (itemA, itemB) =>
      new Date(itemB.publishedAt).getTime() -
      new Date(itemA.publishedAt).getTime(),
  )[0].publishedAt;
}
