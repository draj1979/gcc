import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { ALLOWED_CITIES, lookupCoords } from "./cities";
import { prisma } from "./prisma";

const VALID_HIRING = ["actively_hiring", "selective", "freeze", "unknown"] as const;
type HiringStatus = (typeof VALID_HIRING)[number];

const HiringStatusEnum = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v): HiringStatus => {
    if (v == null) return "unknown";
    const normalized = String(v)
      .toLowerCase()
      .trim()
      .replace(/[\s-]+/g, "_");
    if ((VALID_HIRING as readonly string[]).includes(normalized)) {
      return normalized as HiringStatus;
    }
    if (normalized.includes("hiring") || normalized.includes("active"))
      return "actively_hiring";
    if (normalized.includes("freeze") || normalized.includes("paused"))
      return "freeze";
    if (normalized.includes("select") || normalized.includes("limited"))
      return "selective";
    return "unknown";
  });

const ResearchedLocationSchema = z.object({
  city: z.string(),
  area: z.string().nullable().optional(),
  headcount: z.number().int().nonnegative().nullable().optional(),
});

const ResearchedGccSchema = z.object({
  parentCompany: z.string().min(1),
  hqCountry: z.string().min(1),
  yearEstablishedInIndia: z.number().int().min(1900).max(2100),
  totalHeadcount: z.number().int().nonnegative(),
  indiaLocations: z.array(ResearchedLocationSchema).min(1),
  servicesFunctions: z.array(z.string()),
  leadership: z.array(z.object({ name: z.string(), title: z.string() })),
  techStack: z.array(z.string()),
  hiringStatus: HiringStatusEnum,
  website: z.string().url().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const ResearchOutputSchema = z.object({
  gccs: z.array(z.unknown()),
});

export type ResearchSummary = {
  ok: boolean;
  totalReturned: number;
  totalUpserted: number;
  totalDeleted: number;
  windowStartYear: number;
  windowEndYear: number;
  errors: string[];
  rejectedRows: { parentCompany: string; reason: string }[];
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildPrompt(startYear: number, endYear: number): string {
  return `Find 50 GCCs (captive centers of foreign multinationals) with a Bengaluru office, established in India between ${startYear} and ${endYear}. Reject anything Indian-owned or outside the year window.

Use web_search sparingly (you have a small budget). Use your knowledge first; search only to verify recent launches.

Each entry must have at least one location with city = "Bengaluru". city must come from this list: ${ALLOWED_CITIES.join(", ")}. area should be a real Bengaluru district (Whitefield, Electronic City, Outer Ring Road, Manyata, Koramangala, etc.) or omit.

Output ONLY a single JSON code block, no prose:

\`\`\`json
{"gccs":[{"parentCompany":"Stripe","hqCountry":"USA","yearEstablishedInIndia":2024,"totalHeadcount":800,"indiaLocations":[{"city":"Bengaluru","area":"Whitefield","headcount":800}],"servicesFunctions":["Payments R&D"],"leadership":[{"name":"Jane Doe","title":"MD India"}],"techStack":["Ruby","Go"],"hiringStatus":"actively_hiring","website":"https://stripe.com","notes":"Source: ETtech 2024."}]}
\`\`\`

hiringStatus is one of: actively_hiring, selective, freeze, unknown. Sort newest first. Better fewer real entries than fabricated ones.`;
}

function extractJsonFromText(text: string): unknown {
  const fence = text.match(/```json\s*([\s\S]*?)```/i);
  const raw = fence ? fence[1] : text;
  return JSON.parse(raw.trim());
}

export async function researchAndUpsertGccs(): Promise<ResearchSummary> {
  const now = new Date();
  const endYear = now.getUTCFullYear();
  const startYear = endYear - 5 + 1;

  const summary: ResearchSummary = {
    ok: false,
    totalReturned: 0,
    totalUpserted: 0,
    totalDeleted: 0,
    windowStartYear: startYear,
    windowEndYear: endYear,
    errors: [],
    rejectedRows: [],
  };

  let researchText: string;
  try {
    const result = await generateText({
      model: anthropic("claude-haiku-4-5"),
      prompt: buildPrompt(startYear, endYear),
    });
    researchText = result.text;
  } catch (e) {
    summary.errors.push(`generateText failed: ${(e as Error).message}`);
    return summary;
  }

  let parsed: unknown;
  try {
    parsed = extractJsonFromText(researchText);
  } catch (e) {
    summary.errors.push(
      `Failed to parse JSON from model output: ${(e as Error).message}. First 500 chars: ${researchText.slice(0, 500)}`,
    );
    return summary;
  }

  const outer = ResearchOutputSchema.safeParse(parsed);
  if (!outer.success) {
    summary.errors.push(
      `Outer schema invalid: ${outer.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    );
    return summary;
  }

  summary.totalReturned = outer.data.gccs.length;

  const candidates: z.infer<typeof ResearchedGccSchema>[] = [];
  for (let i = 0; i < outer.data.gccs.length; i++) {
    const row = ResearchedGccSchema.safeParse(outer.data.gccs[i]);
    if (row.success) {
      candidates.push(row.data);
    } else {
      const raw = outer.data.gccs[i] as { parentCompany?: unknown };
      summary.rejectedRows.push({
        parentCompany:
          typeof raw.parentCompany === "string" ? raw.parentCompany : `row ${i}`,
        reason: `schema: ${row.error.issues
          .slice(0, 2)
          .map((iss) => `${iss.path.join(".")}: ${iss.message}`)
          .join("; ")}`,
      });
    }
  }

  const upsertedIds = new Set<string>();

  for (const c of candidates) {
    if (
      c.yearEstablishedInIndia < startYear ||
      c.yearEstablishedInIndia > endYear
    ) {
      summary.rejectedRows.push({
        parentCompany: c.parentCompany,
        reason: `year ${c.yearEstablishedInIndia} outside [${startYear}, ${endYear}]`,
      });
      continue;
    }

    const resolvedLocations = c.indiaLocations
      .map((l) => {
        const coords = lookupCoords(l.city, l.area ?? undefined);
        if (!coords) return null;
        return {
          city: coords.city,
          area: coords.area ?? l.area ?? null,
          lat: coords.lat,
          lng: coords.lng,
          headcount: l.headcount ?? null,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (resolvedLocations.length === 0) {
      summary.rejectedRows.push({
        parentCompany: c.parentCompany,
        reason: `no resolvable locations from cities: ${c.indiaLocations
          .map((l) => l.city)
          .join(", ")}`,
      });
      continue;
    }

    if (!resolvedLocations.some((l) => l.city === "Bengaluru")) {
      summary.rejectedRows.push({
        parentCompany: c.parentCompany,
        reason: `no Bengaluru location (got ${resolvedLocations
          .map((l) => l.city)
          .join(", ")})`,
      });
      continue;
    }

    const id = slugify(c.parentCompany) + "-india";

    try {
      await prisma.gcc.upsert({
        where: { id },
        create: {
          id,
          parentCompany: c.parentCompany,
          hqCountry: c.hqCountry,
          yearEstablishedInIndia: c.yearEstablishedInIndia,
          totalHeadcount: c.totalHeadcount,
          services: c.servicesFunctions,
          techStack: c.techStack,
          hiringStatus: c.hiringStatus,
          website: c.website ?? null,
          notes: c.notes ?? null,
          locations: { create: resolvedLocations },
          leaders: { create: c.leadership },
        },
        update: {
          parentCompany: c.parentCompany,
          hqCountry: c.hqCountry,
          yearEstablishedInIndia: c.yearEstablishedInIndia,
          totalHeadcount: c.totalHeadcount,
          services: c.servicesFunctions,
          techStack: c.techStack,
          hiringStatus: c.hiringStatus,
          website: c.website ?? null,
          notes: c.notes ?? null,
          locations: { deleteMany: {}, create: resolvedLocations },
          leaders: { deleteMany: {}, create: c.leadership },
        },
      });
      upsertedIds.add(id);
    } catch (e) {
      summary.rejectedRows.push({
        parentCompany: c.parentCompany,
        reason: `upsert failed: ${(e as Error).message}`,
      });
    }
  }

  summary.totalUpserted = upsertedIds.size;

  const deleted = await prisma.gcc.deleteMany({
    where: { id: { notIn: Array.from(upsertedIds) } },
  });
  summary.totalDeleted = deleted.count;

  summary.ok = summary.totalUpserted > 0;
  return summary;
}
