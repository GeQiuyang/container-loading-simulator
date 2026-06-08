'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingPlanViewer from '@/components/loading-plan-viewer';

interface PlanDetail {
  id: string;
  containerId: string;
  utilization: number;
  weightRate: number;
  centerOfGravityX: number;
  centerOfGravityY: number;
  centerOfGravityZ: number;
  createdAt: string;
  container: {
    id: string;
    name: string;
    length: number;
    width: number;
    height: number;
    maxPayload: number;
    tareWeight: number;
  };
  items: {
    id: string;
    cargoItemId: string;
    positionX: number;
    positionY: number;
    positionZ: number;
    rotationX: number;
    rotationY: number;
    rotationZ: number;
    cargoItem: {
      id: string;
      name: string;
      length: number;
      width: number;
      height: number;
      weight: number;
      quantity: number;
    };
  }[];
}

export default function LoadingPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/loading-plans/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setPlan(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl space-y-8 p-8">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  if (!plan) {
    return (
      <main className="mx-auto max-w-4xl space-y-8 p-8">
        <p className="text-muted-foreground">Loading plan not found.</p>
        <Button asChild>
          <Link href="/loading-plans">Back to Plans</Link>
        </Button>
      </main>
    );
  }

  const viewerItems = plan.items.map((item) => ({
    id: item.id,
    name: item.cargoItem.name,
    length: item.cargoItem.length,
    width: item.cargoItem.width,
    height: item.cargoItem.height,
    weight: item.cargoItem.weight,
    positionX: item.positionX,
    positionY: item.positionY,
    positionZ: item.positionZ,
    rotationX: item.rotationX,
    rotationY: item.rotationY,
    rotationZ: item.rotationZ,
  }));

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Loading Plan Detail</h1>
          <p className="text-muted-foreground">
            {plan.container.name} &mdash; {plan.items.length} cargo items
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/loading-plans">Back to Plans</Link>
        </Button>
      </div>

      {/* 3D Viewer */}
      <LoadingPlanViewer
        container={{
          length: plan.container.length,
          width: plan.container.width,
          height: plan.container.height,
        }}
        items={viewerItems}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{plan.utilization.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Weight Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{plan.weightRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Center of Gravity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-mono">
              ({plan.centerOfGravityX.toFixed(2)},{' '}
              {plan.centerOfGravityY.toFixed(2)},{' '}
              {plan.centerOfGravityZ.toFixed(2)})
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Container
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {plan.container.length}×{plan.container.width}×{plan.container.height}m
            </p>
            <p className="text-xs text-muted-foreground">
              Max {plan.container.maxPayload}kg
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cargo Items ({plan.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 font-medium text-muted-foreground">Name</th>
                <th className="py-2 font-medium text-muted-foreground">Dim (m)</th>
                <th className="py-2 font-medium text-muted-foreground">Position (x,y,z)</th>
                <th className="py-2 font-medium text-muted-foreground">Rotation</th>
              </tr>
            </thead>
            <tbody>
              {plan.items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-2">{item.cargoItem.name}</td>
                  <td className="py-2 font-mono text-xs">
                    {item.cargoItem.length}×{item.cargoItem.width}×{item.cargoItem.height}
                  </td>
                  <td className="py-2 font-mono text-xs">
                    ({item.positionX.toFixed(2)},{' '}
                    {item.positionY.toFixed(2)},{' '}
                    {item.positionZ.toFixed(2)})
                  </td>
                  <td className="py-2 font-mono text-xs">
                    X:{item.rotationX}° Y:{item.rotationY}° Z:{item.rotationZ}°
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}
