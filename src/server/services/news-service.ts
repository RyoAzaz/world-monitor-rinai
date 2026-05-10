import type { NewsItem, NewsResponse } from "@/types/news";

import { fetchRssSource } from "../providers/news/rss-provider";
import { rssSources } from "../providers/news/rss-sources";

const NEWS_LIMIT = 30;
const NEWS_FETCH_FAILED_MESSAGE = "ニュースRSSの取得に失敗しました。";

export class NewsServiceError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "NewsServiceError";
    this.status = status;
  }
}

export function isNewsServiceError(error: unknown): error is NewsServiceError {
  return error instanceof NewsServiceError;
}

export async function getLatestNews(): Promise<NewsResponse> {
  const results = await Promise.allSettled(
    rssSources.map((source) => fetchRssSource(source)),
  );
  const items = results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );
  const failedCount = results.filter((result) => result.status === "rejected").length;

  if (items.length === 0 && failedCount > 0) {
    throw new NewsServiceError(NEWS_FETCH_FAILED_MESSAGE);
  }

  return {
    items: dedupeNewsItems(items)
      .sort(
        (itemA, itemB) =>
          new Date(itemB.publishedAt).getTime() -
          new Date(itemA.publishedAt).getTime(),
      )
      .slice(0, NEWS_LIMIT),
    fetchedAt: new Date().toISOString(),
    sources: rssSources.map((source) => source.name),
  };
}

function dedupeNewsItems(items: NewsItem[]) {
  const seen = new Set<string>();
  const deduped: NewsItem[] = [];

  for (const item of items) {
    const key = createDedupeKey(item);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}

function createDedupeKey(item: NewsItem) {
  const url = item.url.split("#")[0].split("?")[0].toLowerCase();

  return url || `${item.source}:${item.title}`.toLowerCase();
}
