import { createHash } from "node:crypto";

import { XMLParser } from "fast-xml-parser";

import type { NewsItem } from "@/types/news";
import {
  inferMarketImpact,
  inferRegionTags,
} from "@/server/services/news-classification-rules";

import {
  RSS_REVALIDATE_SECONDS,
  type RssSource,
} from "./rss-sources";

type ParsedFeed = {
  rss?: {
    channel?: {
      item?: unknown;
    };
  };
  feed?: {
    entry?: unknown;
  };
};

const parser = new XMLParser({
  ignoreAttributes: false,
  parseAttributeValue: false,
  parseTagValue: false,
  trimValues: true,
});

const MAX_SUMMARY_LENGTH = 140;

export async function fetchRssSource(source: RssSource): Promise<NewsItem[]> {
  const response = await fetch(source.url, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.1",
    },
    next: { revalidate: RSS_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`${source.name} RSSの取得に失敗しました。`);
  }

  const xml = await response.text();
  const parsed = parser.parse(xml) as ParsedFeed;
  const rawItems = extractFeedItems(parsed);
  const fetchedAt = new Date();

  return rawItems
    .map((item) => normalizeRssItem(item, source, fetchedAt))
    .filter((item): item is NewsItem => item !== null);
}

function extractFeedItems(parsed: ParsedFeed) {
  const rssItems = toArray(parsed.rss?.channel?.item);

  if (rssItems.length > 0) {
    return rssItems;
  }

  return toArray(parsed.feed?.entry);
}

function normalizeRssItem(
  item: unknown,
  source: RssSource,
  fetchedAt: Date,
): NewsItem | null {
  const record = asRecord(item);

  if (!record) {
    return null;
  }

  const title = readText(record.title).trim();
  const url = readLink(record.link).trim();

  if (!title || !url) {
    return null;
  }

  const rawSummary =
    readText(record.description) ||
    readText(record.summary);
  const summary = truncate(cleanText(rawSummary), MAX_SUMMARY_LENGTH);
  const publishedAt = toIsoDate(
    readText(record.pubDate) || readText(record["dc:date"]) || readText(record.updated),
    fetchedAt,
  );
  const searchableText = `${title} ${summary}`;

  return {
    id: createStableId(source.id, url, title),
    source: source.name,
    title,
    url,
    publishedAt,
    summary,
    regionTags: inferRegionTags(searchableText, source.defaultRegionTags),
    marketImpact: inferMarketImpact(searchableText),
  };
}

function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  return value === undefined || value === null ? [] : [value];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function readText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(readText).find(Boolean) ?? "";
  }

  const record = asRecord(value);

  if (!record) {
    return "";
  }

  return readText(record["#text"]) || readText(record.__cdata);
}

function readLink(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(readLink).find(Boolean) ?? "";
  }

  const record = asRecord(value);

  if (!record) {
    return "";
  }

  return readText(record["@_href"]) || readText(record["#text"]);
}

function cleanText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
}

function toIsoDate(value: string, fallback: Date) {
  if (!value) {
    return fallback.toISOString();
  }

  const normalizedValue = value.trim().replace(/\bJST\b/i, "+0900");
  const parsed = new Date(normalizedValue);

  return Number.isNaN(parsed.getTime()) ? fallback.toISOString() : parsed.toISOString();
}

function createStableId(sourceId: string, url: string, title: string) {
  return createHash("sha1")
    .update(`${sourceId}:${url}:${title}`)
    .digest("hex")
    .slice(0, 16);
}
