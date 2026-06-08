'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { CreateCargoItemSchema } from '@/types';
import type { CreateCargoItemFormData, CargoItem } from '@/types';
import { createCargoItemAction, deleteCargoItemAction } from '@/app/actions/cargo-item';

export default function CargoItemsPage() {
  const [cargoItems, setCargoItems] = useState<CargoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCargoItemFormData>({
    resolver: zodResolver(CreateCargoItemSchema),
    defaultValues: {
      quantity: 1,
      rotatable: true,
    },
  });

  async function fetchCargoItems() {
    const res = await fetch('/api/cargo-items');
    const data = await res.json();
    setCargoItems(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchCargoItems();
  }, []);

  async function onSubmit(data: CreateCargoItemFormData) {
    const result = await createCargoItemAction({
      ...data,
      quantity: data.quantity ?? 1,
      rotatable: data.rotatable ?? true,
    });
    if (result.success) {
      reset();
      fetchCargoItems();
    }
  }

  async function handleDelete(id: string | undefined) {
    if (!id) return;
    await deleteCargoItemAction(id);
    fetchCargoItems();
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cargo Item Management</h1>
          <p className="text-muted-foreground">
            Manage cargo items and specifications
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
            <CardTitle>Add Cargo Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="e.g. Steel Pipes Bundle"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="length">Length (m)</Label>
                  <Input
                    id="length"
                    type="number"
                    step="0.001"
                    {...register('length', { valueAsNumber: true })}
                  />
                  {errors.length && (
                    <p className="text-sm text-destructive">
                      {errors.length.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="width">Width (m)</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.001"
                    {...register('width', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (m)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.001"
                    {...register('height', { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    {...register('weight', { valueAsNumber: true })}
                  />
                  {errors.weight && (
                    <p className="text-sm text-destructive">
                      {errors.weight.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    {...register('quantity', { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="rotatable"
                  type="checkbox"
                  {...register('rotatable')}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="rotatable">Rotatable</Label>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Cargo Item'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Cargo Item List */}
        <Card>
          <CardHeader>
            <CardTitle>Cargo Item List ({cargoItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : cargoItems.length === 0 ? (
              <p className="text-muted-foreground">No cargo items yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Dim (m)</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cargoItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.name}
                        {!item.rotatable && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            (fixed)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {item.length}×{item.width}×{item.height}
                      </TableCell>
                      <TableCell>{item.weight.toLocaleString()}kg</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
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
