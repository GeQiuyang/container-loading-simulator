import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const { getCargoItems } = await import('@/services/cargo-item');
  const cargoItems = await getCargoItems();
  return NextResponse.json(cargoItems);
}
