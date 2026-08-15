"use client";

import * as React from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";

import { NAME_TO_DATASET_COUNTRY } from "@/lib/country-aliases";
import type { CountryStat } from "@/lib/types";

const WIDTH = 960;
const HEIGHT = 500;

interface CountryProperties {
  name: string;
}

export function WorldMap({
  data,
  metricKey,
  metricLabel,
  formatValue,
  onHoverChange,
}: {
  data: CountryStat[];
  metricKey: keyof CountryStat;
  metricLabel: string;
  formatValue: (v: number) => string;
  onHoverChange?: (country: CountryStat | null) => void;
}) {
  const [geo, setGeo] = React.useState<FeatureCollection<Geometry, CountryProperties> | null>(null);
  const [hovered, setHovered] = React.useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = React.useState<{ x: number; y: number } | null>(null);
  const svgRef = React.useRef<SVGSVGElement | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/world-110m.json")
      .then((res) => res.json())
      .then((topo: Topology) => {
        if (cancelled) return;
        const collection = feature(
          topo,
          topo.objects.countries as GeometryCollection
        ) as unknown as FeatureCollection<Geometry, CountryProperties>;
        setGeo(collection);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const byCountry = React.useMemo(() => {
    const map = new Map<string, CountryStat>();
    data.forEach((d) => map.set(d.country, d));
    return map;
  }, [data]);

  const { min, max } = React.useMemo(() => {
    const values = data.map((d) => Number(d[metricKey])).filter((v) => !Number.isNaN(v));
    return { min: Math.min(...values, 0), max: Math.max(...values, 1) };
  }, [data, metricKey]);

  const projection = React.useMemo(
    () => geoNaturalEarth1().fitSize([WIDTH, HEIGHT - 20], { type: "Sphere" } as never),
    []
  );
  const pathGenerator = React.useMemo(() => geoPath(projection), [projection]);

  function intensity(value: number): number {
    if (max === min) return 0.15;
    return 0.08 + (Math.max(0, value - min) / (max - min)) * 0.92;
  }

  function handleMove(e: React.MouseEvent<SVGPathElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  if (!geo) {
    return (
      <div className="flex h-[420px] w-full items-center justify-center text-xs text-muted-foreground">
        Loading map…
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        style={{ maxHeight: 440 }}
        onMouseLeave={() => {
          setHovered(null);
          onHoverChange?.(null);
        }}
      >
        <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="transparent" />
        {geo.features.map((f, i) => {
          const code = NAME_TO_DATASET_COUNTRY[f.properties.name];
          const stat = code ? byCountry.get(code) : undefined;
          const d = pathGenerator(f) ?? "";
          const isHovered = hovered === f.properties.name;
          const value = stat ? Number(stat[metricKey]) : null;
          const fillOpacity = value !== null ? intensity(value) : 0.045;
          return (
            <path
              key={i}
              d={d}
              fill="var(--color-foreground)"
              fillOpacity={isHovered ? Math.min(1, fillOpacity + 0.25) : fillOpacity}
              stroke="var(--color-background)"
              strokeWidth={0.4}
              className="transition-[fill-opacity] duration-150"
              style={{ cursor: stat ? "pointer" : "default" }}
              onMouseEnter={() => {
                setHovered(f.properties.name);
                onHoverChange?.(stat ?? null);
              }}
              onMouseMove={handleMove}
            />
          );
        })}
      </svg>

      {hovered && tooltipPos && (
        <div
          className="pointer-events-none absolute z-10 max-w-56 rounded-md border bg-popover px-3 py-2 text-xs shadow-md"
          style={{ left: Math.min(tooltipPos.x + 12, WIDTH - 200), top: Math.max(tooltipPos.y - 10, 0) }}
        >
          {(() => {
            const code = Object.entries(NAME_TO_DATASET_COUNTRY).find(([name]) => name === hovered)?.[1];
            const stat = code ? byCountry.get(code) : undefined;
            if (!stat) {
              return <span className="text-muted-foreground">{hovered} — not in dataset</span>;
            }
            return (
              <div>
                <div className="mb-1 font-medium text-popover-foreground">{hovered}</div>
                <div className="text-muted-foreground">
                  {metricLabel}:{" "}
                  <span className="font-medium text-popover-foreground">
                    {formatValue(Number(stat[metricKey]))}
                  </span>
                </div>
                <div className="mt-1 text-muted-foreground">
                  Minerals produced: <span className="font-medium text-popover-foreground">{stat.n_minerals}</span>
                </div>
                <div className="text-muted-foreground">
                  Avg. supply-risk score:{" "}
                  <span className="font-medium text-popover-foreground">{stat.avg_supply_risk_score}</span>
                </div>
                <div className="text-muted-foreground">
                  Disruption events:{" "}
                  <span className="font-medium text-popover-foreground">{stat.disruption_events}</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
