'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { PipeParams, ContainerDims } from '@/components/pipe-stacking-viewer';
import { computePipeLayout } from '@/components/pipe-stacking-viewer';

const PipeStackingViewer = dynamic(
  () => import('@/components/pipe-stacking-viewer'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[550px] items-center justify-center rounded-xl border bg-muted/30 text-muted-foreground">
        Loading 3D viewer...
      </div>
    ),
  }
);

const CONTAINER_PRESETS: { key: string; label: string; dims: ContainerDims }[] = [
  { key: '20GP', label: '20GP', dims: { length: 5.90, width: 2.35, height: 2.39 } },
  { key: '40GP', label: '40GP', dims: { length: 12.03, width: 2.35, height: 2.38 } },
  { key: '40HQ', label: '40HQ', dims: { length: 12.03, width: 2.35, height: 2.70 } },
  { key: '45HQ', label: '45HQ', dims: { length: 13.56, width: 2.35, height: 2.70 } },
];

export default function PipeStackingPage() {
  const [od, setOd] = useState(300);       // mm
  const [wall, setWall] = useState(5.25);   // mm
  const [length, setLength] = useState(3.12); // m
  const [steelDensity, setSteelDensity] = useState(7850); // kg/m³
  const [containerKey, setContainerKey] = useState('40GP');

  const container = useMemo(() =>
    CONTAINER_PRESETS.find(c => c.key === containerKey)!.dims,
    [containerKey],
  );

  const params: PipeParams = useMemo(() => ({
    od: od / 1000,
    wall: wall / 1000,
    length,
  }), [od, wall, length]);

  const statsInfo = useMemo(() => {
    const { pipes, stats: baseStats } = computePipeLayout(params, container);
    // Customize mass calculation with user density
    const radius = params.od / 2;
    const innerRadius = radius - params.wall;
    const steelVol = Math.PI * (radius ** 2 - innerRadius ** 2) * params.length;
    const pipeMass = (steelVol * steelDensity).toFixed(1);
    const totalMass = (steelVol * steelDensity * pipes.length / 1000).toFixed(1);
    return { ...baseStats, pipeMass, totalMass, pipes, density: steelDensity };
  }, [params, steelDensity, container]);

  // Order of magnitude presets
  const presets = [
    { label: '小口径', od: 100, wall: 2, length: 2 },
    { label: '默认', od: 300, wall: 5.25, length: 3.12 },
    { label: '大口径', od: 500, wall: 8, length: 3 },
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">装载计算器</h1>
          <p className="text-muted-foreground">
            输入导管参数，选择集装箱规格，自动计算最大装载量
          </p>
        </div>
        <Link href="/" className="rounded border px-3 py-1.5 text-sm hover:bg-muted">返回首页</Link>
      </div>

      {/* Formula inputs */}
      <div className="rounded-lg border bg-card p-4">
        {/* Container selector + pipe params */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">集装箱规格</label>
            <select value={containerKey} onChange={e => setContainerKey(e.target.value)}
              className="w-28 rounded border px-2 py-1.5 text-sm font-mono">
              {CONTAINER_PRESETS.map(c => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>
          <span className="pb-1.5 text-muted-foreground">|</span>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">外径 OD (mm)</label>
            <input type="number" value={od} onChange={e => setOd(Number(e.target.value) || 1)}
              min={1} step={0.1}
              className="w-28 rounded border px-2 py-1.5 text-sm font-mono" />
          </div>
          <span className="pb-1.5 text-muted-foreground">×</span>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">壁厚 (mm)</label>
            <input type="number" value={wall} onChange={e => setWall(Number(e.target.value) || 0)}
              min={0.1} step={0.01}
              className="w-28 rounded border px-2 py-1.5 text-sm font-mono" />
          </div>
          <span className="pb-1.5 text-muted-foreground">×</span>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">长度 (m)</label>
            <input type="number" value={length} onChange={e => setLength(Number(e.target.value) || 0.1)}
              min={0.1} step={0.01}
              className="w-28 rounded border px-2 py-1.5 text-sm font-mono" />
          </div>
          <span className="pb-1.5 text-muted-foreground">|</span>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">材料密度 (kg/m³)</label>
            <input type="number" value={steelDensity} onChange={e => setSteelDensity(Number(e.target.value) || 1)}
              min={1} step={10}
              className="w-28 rounded border px-2 py-1.5 text-sm font-mono" />
          </div>
          <span className="pb-1.5 text-xs text-muted-foreground">
            (钢: 7850, 铝: 2700, PVC: 1400)
          </span>
          <div className="flex gap-1 pb-1">
            {presets.map(p => (
              <button key={p.label} type="button"
                onClick={() => { setOd(p.od); setWall(p.wall); setLength(p.length); }}
                className="rounded border px-2 py-1 text-xs hover:bg-muted">
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick results */}
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm border-t pt-3">
          <span>导管: <strong>Φ{od}×{wall.toFixed(2)}mm × {length}m</strong></span>
          <span>单重: <strong className="text-amber-600">{statsInfo.pipeMass} kg</strong></span>
          <span>最大装载: <strong className="text-primary text-lg">{statsInfo.totalPipes} 根</strong></span>
          <span>总重: <strong className="text-amber-600">{statsInfo.totalMass} 吨</strong></span>
          <span>体积利用率: <strong className="text-blue-600">{statsInfo.volumeUtilization}%</strong></span>
        </div>
      </div>

      <PipeStackingViewer params={params} container={container} />

      {/* Legend */}
      <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
        <span className="font-medium">颜色：</span>
        {Array.from({ length: Math.min(statsInfo.perLength, 8) }, (_, i) => (
          <span key={i} className="ml-2 inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full"
              style={{ background: ['#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#f97316','#84cc16'][i] }} />
            第{i+1}组
          </span>
        ))}
        <span className="ml-4">| 每横截面 {statsInfo.perSection} 根 | 六角密堆积 {statsInfo.totalRows} 行</span>
      </div>
    </main>
  );
}
