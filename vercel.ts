import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  crons: [
    {
      path: "/api/cron/refresh-gccs",
      schedule: "30 20 * * 6",
    },
  ],
  functions: {
    "app/api/cron/refresh-gccs/route.ts": {
      maxDuration: 300,
    },
  },
};
