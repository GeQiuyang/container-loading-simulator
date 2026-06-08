'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { PipeParams, ContainerDims, Stats } from '@/components/pipe-stacking-viewer';
import { computePipeLayout } from '@/components/pipe-stacking-viewer';

const DEFAULT_CONTAINER: ContainerDims = { length: 12.03, width: 2.35, height: 2.38 };

export default function PipeCalculatorCard() {
  const [od, setOd] = useState(300);
  const [wall, setWall] = useState(5.25);
  const [length, setLength] = useState(3.12);
  const [steelDensity, setSteelDensity] = useState(7850);

  const params: PipeParams = useMemo(() => ({
    od: od / 1000,
    wall: wall / 1000,
    length,
  }), [od, wall, length]);

  const statsInfo = useMemo(() => {
    const { pipes, stats: baseStats } = computePipeLayout(params, DEFAULT_CONTAINER);
    const radius = params.od / 2;
    const innerRadius = radius - params.wall;
    const steelVol = Math.PI * (radius ** 2 - innerRadius ** 2) * params.length;
    const pipeMass = (steelVol * steelDensity).toFixed(1);
    const totalMass = (steelVol * steelDensity * pipes.length / 1000).toFixed(1);
    return { ...baseStats, pipeMass, totalMass, pipes, density: steelDensity };
  }, [params, steelDensity]);

  const presets = [
    { label: '小口径', od: 100, wall: 2, length: 2 },
    { label: '默认', od: 300, wall: 5.25, length: 3.12 },
    { label: '大口径', od: 500, wall: 8, length: 3 },
  ];

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">空心导管装载计算</h2>
          <p className="text-xs text-muted-foreground">
            40GP 集装箱 (12.03×2.35×2.38m) — 六角密堆积算法
          </p>
        </div>
        <Link
          href="/pipes"
          className="rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:opacity-90"
        >
          3D 视图 →
        </Link>
      </div>

      {/* Inputs */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">外径 OD (mm)</label>
          <input
            type="number" value={od} onChange={e => setOd(Number(e.target.value) || 1)}
            min={1} step={0.1}
            className="w-24 rounded border px-2 py-1.5 text-sm font-mono"
          />
        </div>
        <span className="pb-1.5 text-muted-foreground text-xs">×</span>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">壁厚 (mm)</label>
          <input
            type="number" value={wall} onChange={e => setWall(Number(e.target.value) || 0)}
            min={0.1} step={0.01}
            className="w-24 rounded border px-2 py-1.5 text-sm font-mono"
          />
        </div>
        <span className="pb-1.5 text-muted-foreground text-xs">×</span>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">长度 (m)</label>
          <input
            type="number" value={length} onChange={e => setLength(Number(e.target.value) || 0.1)}
            min={0.1} step={0.01}
            className="w-24 rounded border px-2 py-1.5 text-sm font-mono"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">密度 (kg/m³)</label>
          <input
            type="number" value={steelDensity} onChange={e => setSteelDensity(Number(e.target.value) || 1)}
            min={1} step={10}
            className="w-24 rounded border px-2 py-1.5 text-sm font-mono"
          />
        </div>
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

      {/* Results */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        <ResultBadge label="最大装载" value={`${statsInfo.totalPipes} 根`} highlight />
        <ResultBadge label="每层" value={`${statsInfo.perLength} 根`} />
        <ResultBadge label="每截面" value={`${statsInfo.perSection} 根`} />
        <ResultBadge label="单重" value={`${statsInfo.pipeMass} kg`} />
        <ResultBadge label="总重" value={`${statsInfo.totalMass} 吨`} />
        <ResultBadge label="体积利用率" value={`${statsInfo.volumeUtilization}%`} />
        <ResultBadge label="排布" value={`${statsInfo.totalRows}行 × ${statsInfo.perLength}层`} />
        <ResultBadge label="导管规格" value={`Φ${od}×${wall.toFixed(2)}mm × ${length}m`} wide />
      </div>
    </div>
  );
}

function ResultBadge({ label, value, highlight, wide }: {
  label: string; value: string; highlight?: boolean; wide?: boolean;
}) {
  return (
    <div className={`rounded-lg border bg-muted/30 p-2 text-center ${wide ? 'col-span-3 md:col-span-2' : ''}`}>
      <div className={`text-sm font-bold ${highlight ? 'text-primary' : ''}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
