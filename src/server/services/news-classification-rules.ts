import type { MarketImpact } from "@/types/news";

const regionRules = [
  { tag: "日本", keywords: ["日本", "日銀", "金融庁", "財務省", "JPX", "東証", "円", "国債"] },
  { tag: "米国", keywords: ["米国", "米", "FRB", "FOMC", "NASDAQ", "Nasdaq"] },
  { tag: "中国", keywords: ["中国", "人民元"] },
  { tag: "欧州", keywords: ["欧州", "EU", "ECB"] },
  { tag: "アジア", keywords: ["アジア", "ＡＳＥＡＮ", "ASEAN", "ADB", "アジア開発銀行"] },
  { tag: "ASEAN", keywords: ["ＡＳＥＡＮ", "ASEAN"] },
  { tag: "ADB", keywords: ["ADB", "アジア開発銀行"] },
  { tag: "中東", keywords: ["中東", "原油", "OPEC", "紅海", "イスラエル"] },
  { tag: "G7", keywords: ["G7", "Ｇ７"] },
  { tag: "G20", keywords: ["G20", "Ｇ２０"] },
  { tag: "IMF", keywords: ["IMF", "国際通貨基金"] },
  { tag: "世界", keywords: ["世界", "国際", "グローバル"] },
];

const lowImpactKeywords = [
  "採用",
  "職員募集",
  "職員を募集",
  "調達",
  "入札公告",
  "メンテナンス",
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

export function inferRegionTags(text: string, defaults: string[]) {
  const tags = new Set(defaults);

  for (const rule of regionRules) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      tags.add(rule.tag);
    }
  }

  return Array.from(tags).slice(0, 4);
}

export function inferMarketImpact(text: string): MarketImpact {
  if (lowImpactKeywords.some((keyword) => text.includes(keyword))) {
    return "low";
  }

  if (highImpactKeywords.some((keyword) => text.includes(keyword))) {
    return "high";
  }

  if (mediumImpactKeywords.some((keyword) => text.includes(keyword))) {
    return "medium";
  }

  return "low";
}
