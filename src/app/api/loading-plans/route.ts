import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const { getLoadingPlans } = await import('@/services/loading-plan');
  const plans = await getLoadingPlans();
  return NextResponse.json(plans);
}
