export type RssSource = {
  id: string;
  name: string;
  url: string;
  defaultRegionTags: string[];
};

export const RSS_REVALIDATE_SECONDS = 900;

export const rssSources: RssSource[] = [
  {
    id: "jpx",
    name: "JPX",
    url: "https://www.jpx.co.jp/rss/markets_news.xml",
    defaultRegionTags: ["日本"],
  },
  {
    id: "fsa",
    name: "金融庁",
    url: "https://www.fsa.go.jp/fsaNewsListAll_rss2.xml",
    defaultRegionTags: ["日本"],
  },
  {
    id: "mof",
    name: "財務省",
    url: "https://www.mof.go.jp/news.rss",
    defaultRegionTags: ["日本"],
  },
];
