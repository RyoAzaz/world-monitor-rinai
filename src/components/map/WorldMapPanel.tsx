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

const severityClassName: Record<NewsImpact, string> = {
  高: "map-marker--high",
  中: "map-marker--medium",
  低: "map-marker--medium",
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

function createMarkerElement(event: MapEvent) {
  const markerElement = document.createElement("button");
  markerElement.type = "button";
  markerElement.className = `map-marker ${severityClassName[event.severity]}`;
  markerElement.setAttribute("aria-label", `${event.country}: ${event.title}`);

  return markerElement;
}

function createPopup(event: MapEvent) {
  return new maplibregl.Popup({
    closeButton: false,
    closeOnClick: true,
    offset: 14,
  }).setHTML(
    `<div class="map-popup"><p class="map-popup__title">${event.title}</p><p class="map-popup__meta">${event.country} ・ ${event.category} ・ 影響度 ${event.severity}</p></div>`,
  );
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

    map.once("load", () => {
      addWorldLayers(map);

      for (const event of mockMapEvents) {
        const marker = new maplibregl.Marker({
          anchor: "center",
          element: createMarkerElement(event),
        })
          .setLngLat(event.coordinates)
          .setPopup(createPopup(event))
          .addTo(map);

        markers.push(marker);
      }
    });

    return () => {
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
          <p className="panel__subtitle">地政学イベントと市場材料を地域別に表示</p>
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
      </div>
    </section>
  );
}
