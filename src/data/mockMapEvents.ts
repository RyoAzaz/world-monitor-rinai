import type { MapEvent } from "@/types/dashboard";

export const mockMapEvents: MapEvent[] = [
  {
    id: "tokyo-policy",
    title: "金融政策イベント",
    country: "日本",
    coordinates: [139.767, 35.681],
    severity: "高",
    category: "金融政策",
  },
  {
    id: "new-york-tech",
    title: "米テック株動向",
    country: "米国",
    coordinates: [-74.006, 40.713],
    severity: "中",
    category: "株式市場",
  },
  {
    id: "taiwan-semis",
    title: "半導体供給網",
    country: "台湾",
    coordinates: [121.565, 25.033],
    severity: "中",
    category: "サプライチェーン",
  },
  {
    id: "dubai-energy",
    title: "エネルギー価格リスク",
    country: "中東",
    coordinates: [55.27, 25.204],
    severity: "高",
    category: "地政学",
  },
];
