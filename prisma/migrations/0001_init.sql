-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ContainerType" AS ENUM ('GP20', 'GP40', 'HQ40', 'OPEN_TOP', 'FLAT_RACK');

-- CreateTable
CREATE TABLE "Container" (
    "id" TEXT NOT NULL,
    "type" "ContainerType" NOT NULL,
    "name" TEXT NOT NULL,
    "length" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "maxPayload" DOUBLE PRECISION NOT NULL,
    "tareWeight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Container_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CargoItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "length" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "rotatable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CargoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoadingPlan" (
    "id" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "utilization" DOUBLE PRECISION NOT NULL,
    "weightRate" DOUBLE PRECISION NOT NULL,
    "centerOfGravityX" DOUBLE PRECISION NOT NULL,
    "centerOfGravityY" DOUBLE PRECISION NOT NULL,
    "centerOfGravityZ" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoadingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoadingPlanItem" (
    "id" TEXT NOT NULL,
    "loadingPlanId" TEXT NOT NULL,
    "cargoItemId" TEXT NOT NULL,
    "positionX" DOUBLE PRECISION NOT NULL,
    "positionY" DOUBLE PRECISION NOT NULL,
    "positionZ" DOUBLE PRECISION NOT NULL,
    "rotationX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rotationY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rotationZ" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoadingPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoadingPlan_containerId_idx" ON "LoadingPlan"("containerId");

-- CreateIndex
CREATE INDEX "LoadingPlanItem_loadingPlanId_idx" ON "LoadingPlanItem"("loadingPlanId");

-- CreateIndex
CREATE INDEX "LoadingPlanItem_cargoItemId_idx" ON "LoadingPlanItem"("cargoItemId");

-- AddForeignKey
ALTER TABLE "LoadingPlan" ADD CONSTRAINT "LoadingPlan_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadingPlanItem" ADD CONSTRAINT "LoadingPlanItem_loadingPlanId_fkey" FOREIGN KEY ("loadingPlanId") REFERENCES "LoadingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadingPlanItem" ADD CONSTRAINT "LoadingPlanItem_cargoItemId_fkey" FOREIGN KEY ("cargoItemId") REFERENCES "CargoItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
