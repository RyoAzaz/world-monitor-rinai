import type { FallbackNewsItem } from "@/types/dashboard";

export const fallbackNewsItems: FallbackNewsItem[] = [
  {
    id: "jp-rates",
    headline: "日銀の政策修正観測で円相場が小幅に反発",
    summary:
      "国内金利の先高観が意識され、輸出関連と銀行株への資金配分に注目が集まっています。",
    source: "World Monitor Mock",
    region: "日本",
    category: "金融政策",
    impact: "高",
    publishedAt: "15:05",
  },
  {
    id: "us-tech",
    headline: "米ハイテク株が上昇、半導体関連に買い戻し",
    summary:
      "NASDAQとSOXがそろって上昇し、東京市場でも半導体製造装置株の寄与が意識されています。",
    source: "World Monitor Mock",
    region: "米国",
    category: "株式市場",
    impact: "中",
    publishedAt: "14:40",
  },
  {
    id: "middle-east",
    headline: "中東情勢の緊張が原油価格の支援材料に",
    summary:
      "供給不安が残るなか、エネルギー価格と海運コストの変動が企業収益に与える影響を確認する局面です。",
    source: "World Monitor Mock",
    region: "中東",
    category: "地政学",
    impact: "高",
    publishedAt: "13:55",
  },
  {
    id: "china-demand",
    headline: "中国の景気対策期待でアジア株に買い",
    summary:
      "素材、機械、消費関連で需要回復を織り込む動きが見られますが、指標確認までは慎重姿勢も残ります。",
    source: "World Monitor Mock",
    region: "中国",
    category: "マクロ",
    impact: "中",
    publishedAt: "12:20",
  },
];
