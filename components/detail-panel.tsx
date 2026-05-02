"use client";

import type { GCC, HiringStatus } from "@/lib/gcc-data";

const HIRING_LABELS: Record<HiringStatus, string> = {
  actively_hiring: "Actively hiring",
  selective: "Selective",
  freeze: "Hiring freeze",
  unknown: "Unknown",
};

const HIRING_PILL: Record<HiringStatus, string> = {
  actively_hiring:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  selective: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  freeze: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  unknown: "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300",
};

export function DetailPanel({ gcc, onClose }: { gcc: GCC; onClose: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 flex w-full max-w-md p-3">
      <div className="pointer-events-auto flex w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {gcc.hqCountry} · est. India {gcc.yearEstablishedInIndia}
            </div>
            <h2 className="mt-0.5 truncate text-xl font-semibold tracking-tight">
              {gcc.parentCompany}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${HIRING_PILL[gcc.hiringStatus]}`}
              >
                {HIRING_LABELS[gcc.hiringStatus]}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ~{gcc.totalHeadcount.toLocaleString()} in India
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <Section title="India locations">
            <ul className="space-y-1.5">
              {gcc.indiaLocations.map((l, i) => (
                <li
                  key={i}
                  className="flex items-baseline justify-between gap-3 rounded-md border border-slate-100 px-3 py-2 text-sm dark:border-slate-800"
                >
                  <div>
                    <div className="font-medium">{l.city}</div>
                    {l.area && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">{l.area}</div>
                    )}
                  </div>
                  {l.headcount && (
                    <div className="shrink-0 text-xs text-slate-600 dark:text-slate-400">
                      ~{l.headcount.toLocaleString()}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Services / functions">
            <Pills items={gcc.servicesFunctions} />
          </Section>

          <Section title="Tech stack">
            <Pills items={gcc.techStack} muted />
          </Section>

          <Section title="Leadership">
            <ul className="space-y-1">
              {gcc.leadership.map((p, i) => (
                <li key={i} className="text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-slate-500 dark:text-slate-400"> — {p.title}</span>
                </li>
              ))}
            </ul>
          </Section>

          {gcc.notes && (
            <Section title="Notes">
              <p className="text-sm text-slate-600 dark:text-slate-300">{gcc.notes}</p>
            </Section>
          )}

          {gcc.website && (
            <a
              href={gcc.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Visit website ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Pills({ items, muted = false }: { items: string[]; muted?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ${
            muted
              ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              : "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
          }`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}
