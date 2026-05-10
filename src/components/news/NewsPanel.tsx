"use client";

import { useEffect, useState } from "react";

import type { MarketImpact, NewsItem, NewsResponse } from "@/types/news";

const impactClassName: Record<MarketImpact, string> = {
  high: "pill--high",
  medium: "pill--medium",
  low: "pill--low",
};

const impactLabel: Record<MarketImpact, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export function NewsPanel() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadNews() {
      try {
        const response = await fetch("/api/news", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("ニュースAPIの取得に失敗しました。");
        }

        const payload = (await response.json()) as NewsResponse;

        if (isActive) {
          setItems(payload.items);
          setErrorMessage(null);
        }
      } catch {
        if (isActive) {
          setErrorMessage("ニュースを取得できませんでした。");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadNews();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <aside className="panel news-panel" aria-labelledby="news-panel-title">
      <div className="panel__header">
        <div>
          <h1 className="panel__title" id="news-panel-title">
            マーケットニュース
          </h1>
          <p className="panel__subtitle">地政学・金融政策・株式市場の注目材料</p>
        </div>
      </div>
      <div className="news-list">
        {isLoading ? (
          <NewsStatus title="ニュース取得中" message="公式RSSから最新情報を読み込んでいます。" />
        ) : errorMessage ? (
          <NewsStatus title="取得エラー" message={errorMessage} />
        ) : items.length === 0 ? (
          <NewsStatus title="ニュースなし" message="現在表示できるニュースがありません。" />
        ) : (
          items.map((item) => <NewsListItem item={item} key={item.id} />)
        )}
      </div>
    </aside>
  );
}

function NewsListItem({ item }: { item: NewsItem }) {
  return (
    <article className="news-item">
      <div className="news-item__meta">
        <span className={`pill ${impactClassName[item.marketImpact]}`}>
          影響度 {impactLabel[item.marketImpact]}
        </span>
        {item.regionTags.map((tag) => (
          <span className="pill" key={tag}>
            {tag}
          </span>
        ))}
      </div>
      <h2 className="news-item__headline">
        <a href={item.url} rel="noreferrer" target="_blank">
          {item.title}
        </a>
      </h2>
      <p
        className={`news-item__summary${
          item.summary ? "" : " news-item__summary--empty"
        }`}
      >
        {item.summary || "概要なし"}
      </p>
      <div className="news-item__source">
        {item.source} ・ {formatPublishedAt(item.publishedAt)} JST
      </div>
    </article>
  );
}

function NewsStatus({ title, message }: { title: string; message: string }) {
  return (
    <article className="news-item">
      <h2 className="news-item__headline">{title}</h2>
      <p className="news-item__summary">{message}</p>
    </article>
  );
}

function formatPublishedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "時刻不明";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
