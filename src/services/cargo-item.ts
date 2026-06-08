import { prisma } from '@/lib/prisma';

import type {
  CargoItem,
  CreateCargoItemInput,
  UpdateCargoItemInput,
} from '@/types';

export async function getCargoItems(): Promise<CargoItem[]> {
  return prisma.cargoItem.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function getCargoItemById(id: string): Promise<CargoItem | null> {
  return prisma.cargoItem.findUnique({ where: { id } });
}

export async function createCargoItem(
  data: CreateCargoItemInput,
): Promise<CargoItem> {
  return prisma.cargoItem.create({ data });
}

export async function updateCargoItem(
  id: string,
  data: UpdateCargoItemInput,
): Promise<CargoItem> {
  return prisma.cargoItem.update({ where: { id }, data });
}

export async function deleteCargoItem(id: string): Promise<CargoItem> {
  return prisma.cargoItem.delete({ where: { id } });
}

export async function getCargoItemCount(): Promise<number> {
  return prisma.cargoItem.count();
}
