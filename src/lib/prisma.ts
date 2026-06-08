import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let _prisma: PrismaClient | undefined;

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  if (_prisma) return _prisma;

  _prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    engine: 'library',
  } as never);

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = _prisma;
  }

  return _prisma;
}

const handler: ProxyHandler<PrismaClient> = {
  get(_target, prop: string | symbol) {
    const client = getPrismaClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
};

export const prisma = new Proxy({} as PrismaClient, handler);
