'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreateLoadingPlanSchema } from '@/types';
import type { Container, CargoItem, CreateLoadingPlanFormData } from '@/types';
import { createLoadingPlanAction, deleteLoadingPlanAction } from '@/app/actions/loading-plan';

interface LoadingPlanListItem {
  id: string;
  utilization: number;
  weightRate: number;
  centerOfGravityX: number;
  centerOfGravityY: number;
  centerOfGravityZ: number;
  createdAt: string;
  container: Container;
  items?: { cargoItem: CargoItem }[];
}

export default function LoadingPlansPage() {
  const [plans, setPlans] = useState<LoadingPlanListItem[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [cargoItems, setCargoItems] = useState<CargoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateLoadingPlanFormData>({
    resolver: zodResolver(CreateLoadingPlanSchema),
    defaultValues: {
      items: [{
        cargoItemId: '',
        positionX: 0,
        positionY: 0,
        positionZ: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const watchedItems = watch('items');
  const watchedContainerId = watch('containerId');

  useEffect(() => {
    const container = containers.find((c) => c.id === watchedContainerId);
    setSelectedContainer(container ?? null);
  }, [watchedContainerId, containers]);

  const autoValues = useMemo(() => {
    if (!selectedContainer || !watchedItems) {
      return { utilization: 0, weightRate: 0, centerX: 0, centerY: 0, centerZ: 0 };
    }
    const containerVol = selectedContainer.length * selectedContainer.width * selectedContainer.height;
    let totalVolume = 0;
    let totalWeight = 0;
    let sumMomentX = 0;
    let sumMomentY = 0;
    let sumMomentZ = 0;

    for (const item of watchedItems) {
      const cargo = cargoItems.find((c) => c.id === item.cargoItemId);
      if (!cargo) continue;
      const vol = cargo.length * cargo.width * cargo.height * cargo.quantity;
      const w = cargo.weight * cargo.quantity;
      totalVolume += vol;
      totalWeight += w;
      sumMomentX += w * item.positionX;
      sumMomentY += w * item.positionY;
      sumMomentZ += w * item.positionZ;
    }

    const utilization = Math.min(100, (totalVolume / containerVol) * 100);
    const weightRate = Math.min(100, (totalWeight / selectedContainer.maxPayload) * 100);
    const centerX = totalWeight > 0 ? sumMomentX / totalWeight : 0;
    const centerY = totalWeight > 0 ? sumMomentY / totalWeight : 0;
    const centerZ = totalWeight > 0 ? sumMomentZ / totalWeight : 0;

    return { utilization, weightRate, centerX, centerY, centerZ };
  }, [selectedContainer, watchedItems, cargoItems]);

  useEffect(() => {
    setValue('utilization', autoValues.utilization);
    setValue('weightRate', autoValues.weightRate);
    setValue('centerOfGravityX', autoValues.centerX);
    setValue('centerOfGravityY', autoValues.centerY);
    setValue('centerOfGravityZ', autoValues.centerZ);
  }, [autoValues, setValue]);

  async function fetchData() {
    const [plansRes, containersRes, cargoRes] = await Promise.all([
      fetch('/api/loading-plans'),
      fetch('/api/containers'),
      fetch('/api/cargo-items'),
    ]);
    setPlans(await plansRes.json());
    setContainers(await containersRes.json());
    setCargoItems(await cargoRes.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function onSubmit(data: CreateLoadingPlanFormData) {
    const result = await createLoadingPlanAction({
      ...data,
      items: data.items?.map((item) => ({
        ...item,
        rotationX: item.rotationX ?? 0,
        rotationY: item.rotationY ?? 0,
        rotationZ: item.rotationZ ?? 0,
      })) ?? [],
    });
    if (result.success) {
      reset();
      fetchData();
    }
  }

  async function handleDelete(id: string | undefined) {
    if (!id) return;
    await deleteLoadingPlanAction(id);
    fetchData();
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Loading Plan Management</h1>
          <p className="text-muted-foreground">
            Create and manage container loading plans
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Create Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Loading Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Container Selection */}
              <div className="space-y-2">
                <Label htmlFor="containerId">Container</Label>
                <select
                  id="containerId"
                  {...register('containerId')}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select a container...</option>
                  {containers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.length}×{c.width}×{c.height}m, {c.maxPayload}kg)
                    </option>
                  ))}
                </select>
                {errors.containerId && (
                  <p className="text-sm text-destructive">{errors.containerId.message}</p>
                )}
              </div>

              {/* Cargo Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Cargo Items</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({ cargoItemId: '', positionX: 0, positionY: 0, positionZ: 0, rotationX: 0, rotationY: 0, rotationZ: 0 })
                    }
                  >
                    + Add Item
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="space-y-2 rounded-md border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Item #{index + 1}</span>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <select
                      {...register(`items.${index}.cargoItemId`)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    >
                      <option value="">Select cargo item...</option>
                      {cargoItems.map((ci) => (
                        <option key={ci.id} value={ci.id}>
                          {ci.name} ({ci.length}×{ci.width}×{ci.height}m, {ci.weight}kg)
                        </option>
                      ))}
                    </select>

                    <div className="grid grid-cols-3 gap-1">
                      <div>
                        <Label className="text-xs">Pos X (m)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.positionX`, { valueAsNumber: true })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Pos Y (m)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.positionY`, { valueAsNumber: true })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Pos Z (m)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.positionZ`, { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Auto-calculated stats */}
              <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Utilization:</span>
                  <span className="font-mono">{autoValues.utilization.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Weight Rate:</span>
                  <span className="font-mono">{autoValues.weightRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Center of Gravity:</span>
                  <span className="font-mono">
                    ({autoValues.centerX.toFixed(2)}, {autoValues.centerY.toFixed(2)},{' '}
                    {autoValues.centerZ.toFixed(2)})
                  </span>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Loading Plan'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Plans List */}
        <Card>
          <CardHeader>
            <CardTitle>Loading Plans ({plans.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : plans.length === 0 ? (
              <p className="text-muted-foreground">No loading plans yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Container</TableHead>
                    <TableHead>Util.</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">
                        {plan.container?.name ?? 'N/A'}
                      </TableCell>
                      <TableCell>{plan.utilization.toFixed(1)}%</TableCell>
                      <TableCell>{plan.weightRate.toFixed(1)}%</TableCell>
                      <TableCell className="flex gap-1">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/loading-plans/${plan.id}`}>View</Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(plan.id)}
                        >
                          Del
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
