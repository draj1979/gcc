"use client";

import { useMemo } from "react";
import Map, { Marker, NavigationControl, Popup, type ViewStateChangeEvent } from "react-map-gl/maplibre";
import { useState } from "react";
import type { GCC } from "@/lib/gcc-data";

type MarkerPoint = {
  gcc: GCC;
  city: string;
  area?: string;
  lat: number;
  lng: number;
  headcount?: number;
};

const TILE_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

export function MapView({
  gccs,
  selectedId,
  onSelect,
}: {
  gccs: GCC[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [viewState, setViewState] = useState({
    longitude: 78.9629,
    latitude: 22.5937,
    zoom: 4.4,
  });
  const [hovered, setHovered] = useState<MarkerPoint | null>(null);

  const points: MarkerPoint[] = useMemo(() => {
    const out: MarkerPoint[] = [];
    for (const g of gccs) {
      for (const l of g.indiaLocations) {
        out.push({ gcc: g, city: l.city, area: l.area, lat: l.lat, lng: l.lng, headcount: l.headcount });
      }
    }
    return out;
  }, [gccs]);

  return (
    <Map
      {...viewState}
      onMove={(e: ViewStateChangeEvent) => setViewState(e.viewState)}
      mapStyle={TILE_STYLE}
      style={{ width: "100%", height: "100%" }}
      attributionControl={{ compact: true }}
    >
      <NavigationControl position="top-right" />
      {points.map((p, idx) => {
        const isSelected = p.gcc.id === selectedId;
        const size = sizeForHeadcount(p.headcount ?? p.gcc.totalHeadcount);
        return (
          <Marker
            key={`${p.gcc.id}-${p.city}-${idx}`}
            longitude={p.lng}
            latitude={p.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onSelect(p.gcc.id);
            }}
          >
            <button
              type="button"
              className={`group relative flex items-center justify-center rounded-full border-2 transition-all ${
                isSelected
                  ? "border-white bg-rose-500 scale-110 shadow-lg shadow-rose-500/40"
                  : "border-white bg-indigo-600 hover:bg-indigo-500"
              }`}
              style={{ width: size, height: size }}
              onMouseEnter={() => setHovered(p)}
              onMouseLeave={() => setHovered(null)}
              aria-label={`${p.gcc.parentCompany} – ${p.city}`}
            />
          </Marker>
        );
      })}
      {hovered && (
        <Popup
          longitude={hovered.lng}
          latitude={hovered.lat}
          anchor="bottom"
          closeButton={false}
          closeOnClick={false}
          offset={12}
        >
          <div className="text-xs">
            <div className="font-semibold">{hovered.gcc.parentCompany}</div>
            <div className="opacity-80">
              {hovered.area ? `${hovered.area}, ` : ""}{hovered.city}
            </div>
            {hovered.headcount && (
              <div className="opacity-70 mt-0.5">~{hovered.headcount.toLocaleString()} employees</div>
            )}
          </div>
        </Popup>
      )}
    </Map>
  );
}

function sizeForHeadcount(n: number) {
  if (n >= 50000) return 22;
  if (n >= 20000) return 18;
  if (n >= 5000) return 14;
  if (n >= 1000) return 11;
  return 9;
}
