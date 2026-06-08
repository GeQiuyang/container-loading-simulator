import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

import type {
  Container,
  CreateContainerInput,
  UpdateContainerInput,
} from '@/types';

export async function getContainers(): Promise<Container[]> {
  return prisma.container.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function getContainerById(id: string): Promise<Container | null> {
  return prisma.container.findUnique({ where: { id } });
}

export async function createContainer(
  data: CreateContainerInput,
): Promise<Container> {
  return prisma.container.create({ data });
}

export async function updateContainer(
  id: string,
  data: UpdateContainerInput,
): Promise<Container> {
  return prisma.container.update({ where: { id }, data });
}

export async function deleteContainer(id: string): Promise<Container> {
  return prisma.container.delete({ where: { id } });
}

export async function getContainerCount(): Promise<number> {
  return prisma.container.count();
}

export function getContainerWhereInput(
  type?: string,
): Prisma.ContainerWhereInput {
  return type ? { type: type as Prisma.EnumContainerTypeFilter['equals'] } : {};
}
