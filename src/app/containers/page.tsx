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
import { CreateContainerSchema, ContainerTypeEnum } from '@/types';
import type { CreateContainerInput, Container } from '@/types';
import { createContainerAction, deleteContainerAction } from '@/app/actions/container';

const CONTAINER_TYPE_LABELS: Record<string, string> = {
  GP20: '20GP',
  GP40: '40GP',
  HQ40: '40HQ',
  OPEN_TOP: 'Open Top',
  FLAT_RACK: 'Flat Rack',
};

export default function ContainersPage() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateContainerInput>({
    resolver: zodResolver(CreateContainerSchema),
  });

  async function fetchContainers() {
    const res = await fetch('/api/containers');
    const data = await res.json();
    setContainers(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchContainers();
  }, []);

  async function onSubmit(data: CreateContainerInput) {
    const result = await createContainerAction(data);
    if (result.success) {
      reset();
      fetchContainers();
    }
  }

  async function handleDelete(id: string | undefined) {
    if (!id) return;
    await deleteContainerAction(id);
    fetchContainers();
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Container Management</h1>
          <p className="text-muted-foreground">
            Manage container types and specifications
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
            <CardTitle>Add Container</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Container Type</Label>
                <select
                  id="type"
                  {...register('type')}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {ContainerTypeEnum.options.map((t) => (
                    <option key={t} value={t}>
                      {CONTAINER_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
                {errors.type && (
                  <p className="text-sm text-destructive">{errors.type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register('name')} placeholder="e.g. 20GP Standard" />
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
                    <p className="text-sm text-destructive">{errors.length.message}</p>
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
                  <Label htmlFor="maxPayload">Max Payload (kg)</Label>
                  <Input
                    id="maxPayload"
                    type="number"
                    step="0.1"
                    {...register('maxPayload', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tareWeight">Tare Weight (kg)</Label>
                  <Input
                    id="tareWeight"
                    type="number"
                    step="0.1"
                    {...register('tareWeight', { valueAsNumber: true })}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Container'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Container List */}
        <Card>
          <CardHeader>
            <CardTitle>Container List ({containers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : containers.length === 0 ? (
              <p className="text-muted-foreground">No containers yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Dim (m)</TableHead>
                    <TableHead>Payload</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {containers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        {CONTAINER_TYPE_LABELS[c.type]}
                      </TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell className="text-xs">
                        {c.length}×{c.width}×{c.height}
                      </TableCell>
                      <TableCell>{c.maxPayload.toLocaleString()}kg</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(c.id)}
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
