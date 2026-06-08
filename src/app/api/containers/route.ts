import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const { getContainers } = await import('@/services/container');
  const containers = await getContainers();
  return NextResponse.json(containers);
}
