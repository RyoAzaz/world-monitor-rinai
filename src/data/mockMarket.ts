import type { MarketTicker } from "@/types/dashboard";

export const fallbackMarketTickers: MarketTicker[] = [
  {
    id: "nikkei",
    label: "日経平均",
    value: "38,420.18",
    change: "+0.84%",
    direction: "up",
    updatedAt: "15:00",
    dataKind: "mock",
    note: "実データ未接続",
    priority: 40,
  },
  {
    id: "sox",
    label: "SOX",
    value: "4,812.77",
    change: "+0.46%",
    direction: "up",
    updatedAt: "05:00",
    dataKind: "mock",
    note: "実データ未接続",
    priority: 50,
  },
];
