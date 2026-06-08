'use server';

import { revalidatePath } from 'next/cache';
import {
  createContainer,
  deleteContainer,
  updateContainer,
} from '@/services/container';
import { CreateContainerSchema, UpdateContainerSchema } from '@/types';
import type { CreateContainerInput, UpdateContainerInput } from '@/types';

export async function createContainerAction(
  data: CreateContainerInput,
) {
  const parsed = CreateContainerSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }
  await createContainer(parsed.data);
  revalidatePath('/containers');
  return { success: true, error: null };
}

export async function updateContainerAction(
  id: string,
  data: UpdateContainerInput,
) {
  const parsed = UpdateContainerSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }
  await updateContainer(id, parsed.data);
  revalidatePath('/containers');
  return { success: true, error: null };
}

export async function deleteContainerAction(id: string) {
  await deleteContainer(id);
  revalidatePath('/containers');
  return { success: true };
}
