'use server';

import { revalidatePath } from 'next/cache';
import {
  createCargoItem,
  deleteCargoItem,
  updateCargoItem,
} from '@/services/cargo-item';
import { CreateCargoItemSchema, UpdateCargoItemSchema } from '@/types';
import type { CreateCargoItemInput, UpdateCargoItemInput } from '@/types';

export async function createCargoItemAction(
  data: CreateCargoItemInput,
) {
  const parsed = CreateCargoItemSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }
  await createCargoItem(parsed.data);
  revalidatePath('/cargo-items');
  return { success: true, error: null };
}

export async function updateCargoItemAction(
  id: string,
  data: UpdateCargoItemInput,
) {
  const parsed = UpdateCargoItemSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }
  await updateCargoItem(id, parsed.data);
  revalidatePath('/cargo-items');
  return { success: true, error: null };
}

export async function deleteCargoItemAction(id: string) {
  await deleteCargoItem(id);
  revalidatePath('/cargo-items');
  return { success: true };
}
