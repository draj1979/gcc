import { prisma } from "./prisma";
import type { GCC } from "./gcc-data";

export async function getAllGccs(): Promise<GCC[]> {
  const rows = await prisma.gcc.findMany({
    orderBy: { totalHeadcount: "desc" },
    include: {
      locations: { orderBy: { headcount: "desc" } },
      leaders: { orderBy: { name: "asc" } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    parentCompany: r.parentCompany,
    hqCountry: r.hqCountry,
    yearEstablishedInIndia: r.yearEstablishedInIndia,
    totalHeadcount: r.totalHeadcount,
    indiaLocations: r.locations.map((l) => ({
      city: l.city,
      area: l.area ?? undefined,
      lat: l.lat,
      lng: l.lng,
      headcount: l.headcount ?? undefined,
    })),
    servicesFunctions: r.services,
    leadership: r.leaders.map((p) => ({ name: p.name, title: p.title })),
    techStack: r.techStack,
    hiringStatus: r.hiringStatus,
    website: r.website ?? undefined,
    notes: r.notes ?? undefined,
  }));
}
