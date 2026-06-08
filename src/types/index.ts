import { z } from 'zod';

// ── Container Types ──────────────────────────────────────────────

export const ContainerTypeEnum = z.enum([
  'GP20',
  'GP40',
  'HQ40',
  'OPEN_TOP',
  'FLAT_RACK',
]);

export type ContainerType = z.infer<typeof ContainerTypeEnum>;

export const ContainerSchema = z.object({
  id: z.string().cuid().optional(),
  type: ContainerTypeEnum,
  name: z.string().min(1),
  length: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
  maxPayload: z.number().positive(),
  tareWeight: z.number().positive(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Container = z.infer<typeof ContainerSchema>;

export const CreateContainerSchema = ContainerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateContainerInput = z.infer<typeof CreateContainerSchema>;

export const UpdateContainerSchema = CreateContainerSchema.partial();

export type UpdateContainerInput = z.infer<typeof UpdateContainerSchema>;

// ── Cargo Item Types ─────────────────────────────────────────────

export const CargoItemSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(1),
  length: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
  weight: z.number().positive(),
  quantity: z.number().int().positive().default(1),
  rotatable: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type CargoItem = z.infer<typeof CargoItemSchema>;

export const CreateCargoItemSchema = CargoItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateCargoItemInput = z.infer<typeof CreateCargoItemSchema>;

/** Form input type — fields with defaults become optional for form validation */
export type CreateCargoItemFormData = z.input<typeof CreateCargoItemSchema>;

export const UpdateCargoItemSchema = CreateCargoItemSchema.partial();

export type UpdateCargoItemInput = z.infer<typeof UpdateCargoItemSchema>;

// ── Loading Plan Types ───────────────────────────────────────────

export const LoadingPlanItemSchema = z.object({
  id: z.string().cuid().optional(),
  cargoItemId: z.string(),
  positionX: z.number(),
  positionY: z.number(),
  positionZ: z.number(),
  rotationX: z.number().default(0),
  rotationY: z.number().default(0),
  rotationZ: z.number().default(0),
});

export type LoadingPlanItem = z.infer<typeof LoadingPlanItemSchema>;

export const CreateLoadingPlanItemSchema = LoadingPlanItemSchema.omit({
  id: true,
});

export type CreateLoadingPlanItemInput = z.infer<typeof CreateLoadingPlanItemSchema>;

export const LoadingPlanSchema = z.object({
  id: z.string().cuid().optional(),
  containerId: z.string(),
  utilization: z.number().min(0).max(100),
  weightRate: z.number().min(0).max(100),
  centerOfGravityX: z.number(),
  centerOfGravityY: z.number(),
  centerOfGravityZ: z.number(),
  items: z.array(CreateLoadingPlanItemSchema).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type LoadingPlan = z.infer<typeof LoadingPlanSchema>;

export const CreateLoadingPlanSchema = LoadingPlanSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateLoadingPlanInput = z.infer<typeof CreateLoadingPlanSchema>;

/** Form input type — fields with defaults become optional */
export type CreateLoadingPlanFormData = z.input<typeof CreateLoadingPlanSchema>;
export type CreateLoadingPlanItemFormData = z.input<typeof CreateLoadingPlanItemSchema>;

export const UpdateLoadingPlanSchema = z.object({
  utilization: z.number().min(0).max(100).optional(),
  weightRate: z.number().min(0).max(100).optional(),
  centerOfGravityX: z.number().optional(),
  centerOfGravityY: z.number().optional(),
  centerOfGravityZ: z.number().optional(),
  items: z.array(CreateLoadingPlanItemSchema).optional(),
});

export type UpdateLoadingPlanInput = z.infer<typeof UpdateLoadingPlanSchema>;

// ── Loading Plan with Relations ──────────────────────────────────

export const LoadingPlanWithItemsSchema = LoadingPlanSchema.extend({
  container: ContainerSchema,
  items: z.array(
    LoadingPlanItemSchema.extend({
      cargoItem: CargoItemSchema,
    }),
  ),
});

export type LoadingPlanWithItems = z.infer<typeof LoadingPlanWithItemsSchema>;
