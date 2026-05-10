import type { MarketTicker } from "@/types/dashboard";

export const fallbackMarketTickers: MarketTicker[] = [
  {
    id: "nikkei",
    label: "日経平均",
    value: "38,420.18",
    change: "+0.84%",
    direction: "up",
    updatedAt: "15:00",
  },
  {
    id: "usdjpy",
    label: "USDJPY",
    value: "154.21",
    change: "-0.18%",
    direction: "down",
    updatedAt: "15:05",
  },
  {
    id: "nasdaq",
    label: "NASDAQ",
    value: "17,928.14",
    change: "+1.12%",
    direction: "up",
    updatedAt: "05:00",
  },
  {
    id: "sox",
    label: "SOX",
    value: "4,812.77",
    change: "+0.46%",
    direction: "up",
    updatedAt: "05:00",
  },
];
