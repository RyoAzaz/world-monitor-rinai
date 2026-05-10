import type { RegionCoordinate } from "@/types/map";

export const regionCoordinates: RegionCoordinate[] = [
  {
    tag: "日本",
    label: "日本",
    coordinates: [139.767, 35.681],
    kind: "country",
  },
  {
    tag: "米国",
    label: "米国",
    coordinates: [-77.036, 38.907],
    kind: "country",
  },
  {
    tag: "中国",
    label: "中国",
    coordinates: [116.407, 39.904],
    kind: "country",
  },
  {
    tag: "欧州",
    label: "欧州",
    coordinates: [10, 50],
    kind: "region",
  },
  {
    tag: "中東",
    label: "中東",
    coordinates: [55.27, 25.204],
    kind: "region",
  },
  {
    tag: "アジア",
    label: "アジア",
    coordinates: [103.819, 1.352],
    kind: "region",
  },
  {
    tag: "ASEAN",
    label: "ASEAN",
    coordinates: [103.819, 1.352],
    kind: "region",
  },
  {
    tag: "ADB",
    label: "ADB",
    coordinates: [120.984, 14.599],
    kind: "organization",
  },
  {
    tag: "G7",
    label: "G7",
    coordinates: [10, 50],
    kind: "organization",
  },
  {
    tag: "G20",
    label: "G20",
    coordinates: [0, 20],
    kind: "organization",
  },
  {
    tag: "IMF",
    label: "IMF",
    coordinates: [-77.044, 38.899],
    kind: "organization",
  },
  {
    tag: "世界",
    label: "世界",
    coordinates: [0, 20],
    kind: "region",
  },
];

const regionCoordinateMap = new Map(
  regionCoordinates.map((region) => [region.tag, region]),
);

export function getRegionCoordinate(tag: string) {
  return regionCoordinateMap.get(tag);
}
