'use server';

import { revalidatePath } from 'next/cache';
import {
  createLoadingPlan,
  deleteLoadingPlan,
  updateLoadingPlan,
} from '@/services/loading-plan';
import { CreateLoadingPlanSchema, UpdateLoadingPlanSchema } from '@/types';
import type { CreateLoadingPlanInput, UpdateLoadingPlanInput } from '@/types';

export async function createLoadingPlanAction(
  data: CreateLoadingPlanInput,
) {
  const parsed = CreateLoadingPlanSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }
  await createLoadingPlan(parsed.data);
  revalidatePath('/loading-plans');
  return { success: true, error: null };
}

export async function updateLoadingPlanAction(
  id: string,
  data: UpdateLoadingPlanInput,
) {
  const parsed = UpdateLoadingPlanSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }
  await updateLoadingPlan(id, parsed.data);
  revalidatePath('/loading-plans');
  revalidatePath(`/loading-plans/${id}`);
  return { success: true, error: null };
}

export async function deleteLoadingPlanAction(id: string) {
  await deleteLoadingPlan(id);
  revalidatePath('/loading-plans');
  return { success: true };
}
