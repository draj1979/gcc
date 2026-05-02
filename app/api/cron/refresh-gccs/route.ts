import type { NextRequest } from "next/server";
import { researchAndUpsertGccs } from "@/lib/gcc-research";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }

  const startedAt = new Date().toISOString();
  const summary = await researchAndUpsertGccs();
  return Response.json({ startedAt, finishedAt: new Date().toISOString(), ...summary });
}
