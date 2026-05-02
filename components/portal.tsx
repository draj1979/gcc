"use client";

import { useMemo, useState } from "react";
import type { GCC, HiringStatus } from "@/lib/gcc-data";
import { MapView } from "./map-view";
import { Sidebar } from "./sidebar";
import { DetailPanel } from "./detail-panel";

export type Filters = {
  query: string;
  hqCountry: string | null;
  city: string | null;
  hiringStatus: HiringStatus | null;
};

export function Portal({ gccs }: { gccs: GCC[] }) {
  const [filters, setFilters] = useState<Filters>({
    query: "",
    hqCountry: null,
    city: null,
    hiringStatus: null,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return gccs.filter((g) => {
      if (q && !g.parentCompany.toLowerCase().includes(q)) return false;
      if (filters.hqCountry && g.hqCountry !== filters.hqCountry) return false;
      if (filters.city && !g.indiaLocations.some((l) => l.city === filters.city)) return false;
      if (filters.hiringStatus && g.hiringStatus !== filters.hiringStatus) return false;
      return true;
    });
  }, [gccs, filters]);

  const selected = useMemo(
    () => gccs.find((g) => g.id === selectedId) ?? null,
    [gccs, selectedId],
  );

  const cities = useMemo(() => {
    const s = new Set<string>();
    gccs.forEach((g) => g.indiaLocations.forEach((l) => s.add(l.city)));
    return Array.from(s).sort();
  }, [gccs]);

  const countries = useMemo(() => {
    const s = new Set<string>();
    gccs.forEach((g) => s.add(g.hqCountry));
    return Array.from(s).sort();
  }, [gccs]);

  return (
    <div className="flex h-screen w-screen flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar
        gccs={filtered}
        totalCount={gccs.length}
        filters={filters}
        onFiltersChange={setFilters}
        selectedId={selectedId}
        onSelect={setSelectedId}
        cities={cities}
        countries={countries}
      />
      <div className="relative flex-1">
        <MapView
          gccs={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        {selected && (
          <DetailPanel gcc={selected} onClose={() => setSelectedId(null)} />
        )}
      </div>
    </div>
  );
}
