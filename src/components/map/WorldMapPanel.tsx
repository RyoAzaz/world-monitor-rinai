"use client";

import { useEffect, useRef } from "react";
import maplibregl, {
  type GeoJSONSourceSpecification,
  type Map as MapLibreMap,
  type Marker,
  type StyleSpecification,
} from "maplibre-gl";
import { mockMapEvents } from "@/data/mockMapEvents";
import type { MapEvent, NewsImpact } from "@/types/dashboard";
import type {
  MapEventSeverity,
  NewsMapEvent,
  NewsMapEventsResponse,
} from "@/types/map";

type RegionFeature = {
  type: "Feature";
  properties: {
    name: string;
  };
  geometry: {
    type: "Polygon";
    coordinates: [number, number][][];
  };
};

type RegionFeatureCollection = {
  type: "FeatureCollection";
  features: RegionFeature[];
};

const mapStyle: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "#07111d",
      },
    },
  ],
};

const worldRegionsGeoJson: RegionFeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "North America" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-168, 14],
            [-142, 58],
            [-98, 72],
            [-52, 48],
            [-68, 18],
            [-102, 8],
            [-168, 14],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "South America" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-82, 12],
            [-50, 6],
            [-35, -22],
            [-58, -56],
            [-76, -32],
            [-82, 12],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Europe" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-12, 36],
            [10, 60],
            [42, 58],
            [52, 42],
            [22, 35],
            [-12, 36],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Africa" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-18, 34],
            [35, 32],
            [52, 6],
            [28, -34],
            [-12, -31],
            [-18, 34],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Asia" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [38, 5],
            [58, 54],
            [112, 68],
            [150, 48],
            [146, 10],
            [104, -8],
            [72, 4],
            [38, 5],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Oceania" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [112, -10],
            [154, -12],
            [162, -38],
            [128, -46],
            [112, -10],
          ],
        ],
      },
    },
  ],
};

const severityClassName: Record<MapEventSeverity, string> = {
  high: "map-marker--high",
  medium: "map-marker--medium",
  low: "map-marker--low",
};

const severityLabel: Record<MapEventSeverity, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const legacySeverityMap: Record<NewsImpact, MapEventSeverity> = {
  高: "high",
  中: "medium",
  低: "low",
};

function addWorldLayers(map: MapLibreMap) {
  if (!map.getSource("world-regions")) {
    const source: GeoJSONSourceSpecification = {
      type: "geojson",
      data: worldRegionsGeoJson as GeoJSONSourceSpecification["data"],
    };

    map.addSource("world-regions", source);
  }

  if (!map.getLayer("world-regions-fill")) {
    map.addLayer({
      id: "world-regions-fill",
      type: "fill",
      source: "world-regions",
      paint: {
        "fill-color": "#17263a",
        "fill-opacity": 0.82,
      },
    });
  }

  if (!map.getLayer("world-regions-line")) {
    map.addLayer({
      id: "world-regions-line",
      type: "line",
      source: "world-regions",
      paint: {
        "line-color": "#36506f",
        "line-width": 1,
      },
    });
  }
}

function createMarkerElement(event: NewsMapEvent) {
  const markerElement = document.createElement("button");
  markerElement.type = "button";
  markerElement.className = `map-marker ${severityClassName[event.severity]}`;
  markerElement.setAttribute(
    "aria-label",
    `${event.regionLabel}: ${event.topNewsTitle}`,
  );

  return markerElement;
}

function createPopup(event: NewsMapEvent) {
  const popupElement = document.createElement("div");
  popupElement.className = "map-popup";

  const titleElement = document.createElement("p");
  titleElement.className = "map-popup__title";
  titleElement.textContent = event.title;

  const metaElement = document.createElement("p");
  metaElement.className = "map-popup__meta";
  metaElement.textContent = `ニュース由来 ・ 代表点 ・ ${event.itemCount}件 ・ 最大影響度 ${severityLabel[event.severity]}`;

  const newsElement = document.createElement("p");
  newsElement.className = "map-popup__meta";
  newsElement.textContent = `代表ニュース: ${event.topNewsTitle}`;

  const noteElement = document.createElement("p");
  noteElement.className = "map-popup__meta";
  noteElement.textContent = `${event.regionLabel}に関連する代表点です。発生地点ではありません。`;

  popupElement.append(titleElement, metaElement, newsElement, noteElement);

  return new maplibregl.Popup({
    closeButton: false,
    closeOnClick: true,
    offset: 14,
  }).setDOMContent(popupElement);
}

function toFallbackNewsMapEvent(event: MapEvent): NewsMapEvent {
  return {
    id: `mock:${event.id}`,
    title: event.title,
    regionTag: event.country,
    regionLabel: event.country,
    coordinates: event.coordinates,
    severity: legacySeverityMap[event.severity],
    itemCount: 1,
    source: "mock",
    latestPublishedAt: new Date().toISOString(),
    topNewsTitle: event.title,
    isRepresentativePoint: true,
  };
}

async function fetchNewsMapEvents() {
  const response = await fetch("/api/map-events/news", { cache: "no-store" });

  if (!response.ok) {
    throw new Error("ニュース由来の地図イベント取得に失敗しました。");
  }

  const payload = (await response.json()) as NewsMapEventsResponse;

  return payload.events;
}

function addEventMarkers(
  map: MapLibreMap,
  markers: Marker[],
  events: NewsMapEvent[],
) {
  for (const event of events) {
    const marker = new maplibregl.Marker({
      anchor: "center",
      element: createMarkerElement(event),
    })
      .setLngLat(event.coordinates)
      .setPopup(createPopup(event))
      .addTo(map);

    markers.push(marker);
  }
}

export function WorldMapPanel() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: [20, 18],
      zoom: 1.2,
      minZoom: 0.8,
      maxZoom: 5,
      attributionControl: false,
    });

    const markers: Marker[] = [];
    mapRef.current = map;

    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: false }),
      "top-left",
    );

    let isActive = true;

    map.once("load", () => {
      addWorldLayers(map);

      void fetchNewsMapEvents()
        .then((events) => {
          if (!isActive) {
            return;
          }

          addEventMarkers(
            map,
            markers,
            events.length > 0
              ? events
              : mockMapEvents.map(toFallbackNewsMapEvent),
          );
        })
        .catch(() => {
          if (!isActive) {
            return;
          }

          addEventMarkers(
            map,
            markers,
            mockMapEvents.map(toFallbackNewsMapEvent),
          );
        });
    });

    return () => {
      isActive = false;

      for (const marker of markers) {
        marker.remove();
      }

      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <section className="panel map-panel" aria-labelledby="map-panel-title">
      <div className="panel__header">
        <div>
          <h1 className="panel__title" id="map-panel-title">
            世界地図モニター
          </h1>
          <p className="panel__subtitle">
            ニュースに関連する地域の代表点を表示。正確な発生地点ではありません。
          </p>
        </div>
      </div>
      <div className="map-panel__canvas" ref={containerRef} />
      <div className="map-panel__legend" aria-label="地図凡例">
        <span className="legend-item">
          <span className="legend-dot legend-dot--high" />
          影響度 高
        </span>
        <span className="legend-item">
          <span className="legend-dot legend-dot--medium" />
          影響度 中
        </span>
        <span className="legend-item">
          <span className="legend-dot legend-dot--low" />
          影響度 低
        </span>
      </div>
    </section>
  );
}
