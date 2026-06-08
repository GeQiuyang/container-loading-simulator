import { prisma } from '@/lib/prisma';

import type {
  LoadingPlan,
  LoadingPlanWithItems,
  CreateLoadingPlanInput,
  UpdateLoadingPlanInput,
} from '@/types';

export async function getLoadingPlans(): Promise<LoadingPlan[]> {
  return prisma.loadingPlan.findMany({
    include: { container: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getLoadingPlanById(
  id: string,
): Promise<LoadingPlanWithItems | null> {
  return prisma.loadingPlan.findUnique({
    where: { id },
    include: {
      container: true,
      items: { include: { cargoItem: true } },
    },
  });
}

export async function getLoadingPlansByContainerId(
  containerId: string,
): Promise<LoadingPlan[]> {
  return prisma.loadingPlan.findMany({
    where: { containerId },
    include: { container: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createLoadingPlan(
  data: CreateLoadingPlanInput,
): Promise<LoadingPlanWithItems> {
  const { items, ...planData } = data;

  return prisma.loadingPlan.create({
    data: {
      ...planData,
      items: items
        ? {
            create: items.map((item) => ({
              cargoItemId: item.cargoItemId,
              positionX: item.positionX,
              positionY: item.positionY,
              positionZ: item.positionZ,
              rotationX: item.rotationX ?? 0,
              rotationY: item.rotationY ?? 0,
              rotationZ: item.rotationZ ?? 0,
            })),
          }
        : undefined,
    },
    include: {
      container: true,
      items: { include: { cargoItem: true } },
    },
  });
}

export async function updateLoadingPlan(
  id: string,
  data: UpdateLoadingPlanInput,
): Promise<LoadingPlanWithItems> {
  const { items, ...planData } = data;

  if (items) {
    await prisma.loadingPlanItem.deleteMany({ where: { loadingPlanId: id } });
  }

  return prisma.loadingPlan.update({
    where: { id },
    data: {
      ...planData,
      items: items
        ? {
            create: items.map((item) => ({
              cargoItemId: item.cargoItemId,
              positionX: item.positionX,
              positionY: item.positionY,
              positionZ: item.positionZ,
              rotationX: item.rotationX ?? 0,
              rotationY: item.rotationY ?? 0,
              rotationZ: item.rotationZ ?? 0,
            })),
          }
        : undefined,
    },
    include: {
      container: true,
      items: { include: { cargoItem: true } },
    },
  });
}

export async function deleteLoadingPlan(id: string): Promise<LoadingPlan> {
  return prisma.loadingPlan.delete({ where: { id } });
}

export async function getLoadingPlanCount(): Promise<number> {
  return prisma.loadingPlan.count();
}
