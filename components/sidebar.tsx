"use client";

import type { GCC, HiringStatus } from "@/lib/gcc-data";
import type { Filters } from "./portal";

const HIRING_LABELS: Record<HiringStatus, string> = {
  actively_hiring: "Actively hiring",
  selective: "Selective",
  freeze: "Hiring freeze",
  unknown: "Unknown",
};

const HIRING_DOT: Record<HiringStatus, string> = {
  actively_hiring: "bg-emerald-500",
  selective: "bg-amber-500",
  freeze: "bg-rose-500",
  unknown: "bg-slate-400",
};

export function Sidebar({
  gccs,
  totalCount,
  filters,
  onFiltersChange,
  selectedId,
  onSelect,
  cities,
  countries,
}: {
  gccs: GCC[];
  totalCount: number;
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  cities: string[];
  countries: string[];
}) {
  return (
    <aside className="flex w-[360px] shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 p-4 dark:border-slate-800">
        <h1 className="text-lg font-semibold tracking-tight">India GCC Atlas</h1>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Global Capability Centers across India
        </p>
      </div>

      <div className="space-y-3 border-b border-slate-200 p-4 dark:border-slate-800">
        <input
          type="search"
          placeholder="Search company…"
          value={filters.query}
          onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800"
        />

        <div className="grid grid-cols-2 gap-2">
          <Select
            label="HQ country"
            value={filters.hqCountry ?? ""}
            onChange={(v) => onFiltersChange({ ...filters, hqCountry: v || null })}
            options={countries}
          />
          <Select
            label="City"
            value={filters.city ?? ""}
            onChange={(v) => onFiltersChange({ ...filters, city: v || null })}
            options={cities}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(HIRING_LABELS) as HiringStatus[]).map((s) => {
            const active = filters.hiringStatus === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() =>
                  onFiltersChange({ ...filters, hiringStatus: active ? null : s })
                }
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
                  active
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200"
                    : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${HIRING_DOT[s]}`} />
                {HIRING_LABELS[s]}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          Showing <span className="font-medium text-slate-900 dark:text-slate-100">{gccs.length}</span> of {totalCount} GCCs
        </div>
      </div>

      <ul className="flex-1 overflow-y-auto">
        {gccs.map((g) => {
          const isSelected = g.id === selectedId;
          return (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => onSelect(g.id)}
                className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60 ${
                  isSelected ? "bg-indigo-50 dark:bg-indigo-500/10" : ""
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div className="truncate text-sm font-semibold">{g.parentCompany}</div>
                  <div className="shrink-0 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {g.hqCountry}
                  </div>
                </div>
                <div className="mt-0.5 truncate text-xs text-slate-600 dark:text-slate-400">
                  {g.indiaLocations.map((l) => l.city).join(" · ")}
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    ~{formatHeadcount(g.totalHeadcount)} · est. {g.yearEstablishedInIndia}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                    <span className={`h-1.5 w-1.5 rounded-full ${HIRING_DOT[g.hiringStatus]}`} />
                    {HIRING_LABELS[g.hiringStatus]}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
        {gccs.length === 0 && (
          <li className="p-6 text-center text-sm text-slate-500">No GCCs match these filters.</li>
        )}
      </ul>
    </aside>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800"
      >
        <option value="">All {label.toLowerCase()}s</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function formatHeadcount(n: number) {
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return String(n);
}
