import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { ALLOWED_CITIES, lookupCoords } from "./cities";
import { prisma } from "./prisma";

const HiringStatusEnum = z.enum([
  "actively_hiring",
  "selective",
  "freeze",
  "unknown",
]);

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
  gccs: z.array(ResearchedGccSchema),
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
  return `You are researching India's Global Capability Center (GCC) ecosystem, focused on Bengaluru.

Find the **100 most recently established GCCs in Bengaluru** that were set up between **${startYear}** and **${endYear}** inclusive. A GCC is a captive offshore center of a foreign-headquartered multinational (NOT an Indian outsourcer like TCS/Infosys/Wipro, NOT a domestic Indian company). EVERY company you return must have at least one office in Bengaluru — that is the entire point of this list.

USE THE web_search TOOL liberally — search for "GCC Bengaluru 2024 launch", "captive center Bangalore 2025", "global capability center new Bengaluru 2026", "[Company] opens Bangalore office", NASSCOM Bangalore reports, Economic Times Tech, Moneycontrol, GCCXchange announcements. Cite at least one source per company in the notes field.

CONSTRAINTS:
- yearEstablishedInIndia must be in [${startYear}, ${endYear}]. Reject candidates outside this window.
- Every entry MUST have at least one indiaLocation with city = "Bengaluru". Reject candidates without a confirmed Bengaluru office.
- The city field for each location MUST be picked from this exact list (case-sensitive):
  ${ALLOWED_CITIES.join(", ")}
- area is free-form (e.g., "Whitefield", "Electronic City", "Manyata Tech Park", "Outer Ring Road") but MUST be a real, named tech park or district within the chosen city. Omit if uncertain.
- totalHeadcount: integer; if reported as "500+" use 500; if a range "1000-1500" use the midpoint 1250; if unknown use a conservative estimate. Headcount is the India total, not Bengaluru-only.
- hiringStatus: pick "actively_hiring" if recent job posts exist, "selective" if some openings, "freeze" if confirmed pause, otherwise "unknown".

OUTPUT FORMAT:
Return a SINGLE JSON code block (markdown fence with the language tag json) containing exactly this shape:

\`\`\`json
{
  "gccs": [
    {
      "parentCompany": "string (e.g. 'Stripe')",
      "hqCountry": "string (e.g. 'USA')",
      "yearEstablishedInIndia": 2024,
      "totalHeadcount": 800,
      "indiaLocations": [
        { "city": "Bengaluru", "area": "Whitefield", "headcount": 800 }
      ],
      "servicesFunctions": ["Payments R&D", "Risk", "Engineering"],
      "leadership": [{ "name": "Jane Doe", "title": "MD India" }],
      "techStack": ["Ruby", "Go", "AWS"],
      "hiringStatus": "actively_hiring",
      "website": "https://stripe.com",
      "notes": "Sources: ETtech 2024-03-12, NASSCOM GCC Report 2024."
    }
  ]
}
\`\`\`

REQUIREMENTS:
- Aim for 100 entries; never fabricate. Better to return 60 verified than 100 with hallucinations.
- Sort newest first (highest yearEstablishedInIndia first).
- Output ONLY the JSON code block. No prose before or after.`;
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
      model: anthropic("claude-sonnet-4-6"),
      tools: {
        web_search: anthropic.tools.webSearch_20250305({ maxUses: 30 }),
      },
      prompt: buildPrompt(startYear, endYear),
      providerOptions: {
        anthropic: { effort: "high" },
      },
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

  const validation = ResearchOutputSchema.safeParse(parsed);
  if (!validation.success) {
    summary.errors.push(
      `Schema validation failed: ${validation.error.issues
        .slice(0, 5)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    );
    return summary;
  }

  const candidates = validation.data.gccs;
  summary.totalReturned = candidates.length;

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
