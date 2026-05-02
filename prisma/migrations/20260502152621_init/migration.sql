-- CreateEnum
CREATE TYPE "HiringStatus" AS ENUM ('actively_hiring', 'selective', 'freeze', 'unknown');

-- CreateTable
CREATE TABLE "Gcc" (
    "id" TEXT NOT NULL,
    "parentCompany" TEXT NOT NULL,
    "hqCountry" TEXT NOT NULL,
    "yearEstablishedInIndia" INTEGER NOT NULL,
    "totalHeadcount" INTEGER NOT NULL,
    "services" TEXT[],
    "techStack" TEXT[],
    "hiringStatus" "HiringStatus" NOT NULL DEFAULT 'unknown',
    "website" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gcc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndiaLocation" (
    "id" TEXT NOT NULL,
    "gccId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "area" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "headcount" INTEGER,

    CONSTRAINT "IndiaLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leader" (
    "id" TEXT NOT NULL,
    "gccId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Leader_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Gcc_hqCountry_idx" ON "Gcc"("hqCountry");

-- CreateIndex
CREATE INDEX "Gcc_hiringStatus_idx" ON "Gcc"("hiringStatus");

-- CreateIndex
CREATE INDEX "IndiaLocation_gccId_idx" ON "IndiaLocation"("gccId");

-- CreateIndex
CREATE INDEX "IndiaLocation_city_idx" ON "IndiaLocation"("city");

-- CreateIndex
CREATE INDEX "Leader_gccId_idx" ON "Leader"("gccId");

-- AddForeignKey
ALTER TABLE "IndiaLocation" ADD CONSTRAINT "IndiaLocation_gccId_fkey" FOREIGN KEY ("gccId") REFERENCES "Gcc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leader" ADD CONSTRAINT "Leader_gccId_fkey" FOREIGN KEY ("gccId") REFERENCES "Gcc"("id") ON DELETE CASCADE ON UPDATE CASCADE;
