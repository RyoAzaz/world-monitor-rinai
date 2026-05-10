import { createHash } from "node:crypto";

import { XMLParser } from "fast-xml-parser";

import type { MarketImpact, NewsItem } from "@/types/news";

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

const regionRules = [
  { tag: "日本", keywords: ["日本", "日銀", "金融庁", "財務省", "JPX", "東証", "円", "国債"] },
  { tag: "米国", keywords: ["米国", "米", "FRB", "FOMC", "NASDAQ", "Nasdaq"] },
  { tag: "中国", keywords: ["中国", "人民元"] },
  { tag: "欧州", keywords: ["欧州", "EU", "ECB"] },
  { tag: "中東", keywords: ["中東", "原油", "OPEC", "紅海", "イスラエル"] },
  { tag: "世界", keywords: ["世界", "国際", "グローバル"] },
];

const highImpactKeywords = [
  "金融政策",
  "為替",
  "金利",
  "国債",
  "制裁",
  "地政学",
  "緊急",
  "停止",
  "売買停止",
  "注意喚起",
  "行政処分",
  "破綻",
  "災害",
  "戦争",
];

const mediumImpactKeywords = [
  "決算",
  "上場",
  "制度",
  "規制",
  "税制",
  "予算",
  "入札",
  "統計",
  "市場",
  "取引",
  "ETF",
  "投資",
];

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
    readText(record.summary) ||
    readText(record["content:encoded"]);
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

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? fallback.toISOString() : parsed.toISOString();
}

function inferRegionTags(text: string, defaults: string[]) {
  const tags = new Set(defaults);

  for (const rule of regionRules) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      tags.add(rule.tag);
    }
  }

  return Array.from(tags).slice(0, 4);
}

function inferMarketImpact(text: string): MarketImpact {
  if (highImpactKeywords.some((keyword) => text.includes(keyword))) {
    return "high";
  }

  if (mediumImpactKeywords.some((keyword) => text.includes(keyword))) {
    return "medium";
  }

  return "low";
}

function createStableId(sourceId: string, url: string, title: string) {
  return createHash("sha1")
    .update(`${sourceId}:${url}:${title}`)
    .digest("hex")
    .slice(0, 16);
}
