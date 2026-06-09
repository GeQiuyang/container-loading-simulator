'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import VesselModel, { VESSEL_DIMS } from '@/components/vessel-model';

const CONE_HEIGHT = VESSEL_DIMS.coneHeight;

export default function VesselPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">锥底罐体 3D 模型</h1>
          <p className="text-muted-foreground">
            圆柱内径 410mm / 壁厚 4.5mm / 圆锥段斜边 900mm / 出水口 100mm
          </p>
        </div>
        <Link href="/" className="rounded border px-3 py-1.5 text-sm hover:bg-muted">
          返回首页
        </Link>
      </div>

      {/* 3D Viewer */}
      <div className="h-[600px] w-full overflow-hidden rounded-xl border">
        <Canvas
          camera={{ position: [1.0, 0.3, 0.8], fov: 35, near: 0.01, far: 50 }}
          style={{ background: '#f1f5f9' }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[3, 5, 4]} intensity={1.2} />
            <directionalLight position={[-2, 2, -3]} intensity={0.4} />
            <VesselModel />
            <OrbitControls
              target={[0, -VESSEL_DIMS.totalHeight / 2 + 0.2, 0]}
              enableDamping
              dampingFactor={0.08}
              minDistance={0.3}
              maxDistance={4}
            />
            {/* Ground grid for scale reference */}
            <gridHelper
              args={[2, 20, '#cbd5e1', '#e2e8f0']}
              position={[0, -VESSEL_DIMS.totalHeight - 0.001, 0]}
            />
            {/* Dimension markers */}
            <axesHelper args={[1.5]} />
          </Suspense>
        </Canvas>
      </div>

      {/* Dimension cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <DimCard
          label="总高度"
          value={`${(VESSEL_DIMS.totalHeight * 1000).toFixed(1)} mm`}
          detail={`圆柱 ${310} + 锥段 ${CONE_HEIGHT.toFixed(1)} + 出水口 ${200}`}
        />
        <DimCard
          label="最大外径"
          value={`${(VESSEL_DIMS.maxDiameter * 1000).toFixed(1)} mm`}
          detail={`内径 410mm + 壁厚 4.5mm × 2`}
        />
        <DimCard
          label="圆锥段轴向高度"
          value={`${(CONE_HEIGHT * 1000).toFixed(1)} mm`}
          detail={`斜边 900mm, Δr=155mm → √(900²−155²)`}
        />
        <DimCard
          label="内腔容积"
          value={`${(VESSEL_DIMS.innerVolume * 1000).toFixed(1)} L`}
          detail={`≈ ${VESSEL_DIMS.innerVolume.toFixed(3)} m³`}
        />
      </div>

      {/* Full spec table */}
      <div className="rounded-lg border">
        <div className="border-b px-4 py-3 font-medium">完整几何参数</div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 px-4">参数</th>
                <th className="py-2 px-4">数值 (mm)</th>
                <th className="py-2 px-4">数值 (m)</th>
                <th className="py-2 px-4">说明</th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              <tr className="border-b">
                <td className="py-2 px-4">圆柱内径</td>
                <td className="py-2 px-4">410.0</td>
                <td className="py-2 px-4">0.410</td>
                <td className="py-2 px-4 text-muted-foreground">主缸体内径</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4">圆柱外径</td>
                <td className="py-2 px-4">419.0</td>
                <td className="py-2 px-4">0.419</td>
                <td className="py-2 px-4 text-muted-foreground">内径 + 2×壁厚</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4">壁厚</td>
                <td className="py-2 px-4">4.5</td>
                <td className="py-2 px-4">0.0045</td>
                <td className="py-2 px-4 text-muted-foreground">均匀壁厚</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4">圆柱高度</td>
                <td className="py-2 px-4">310.0</td>
                <td className="py-2 px-4">0.310</td>
                <td className="py-2 px-4 text-muted-foreground">直筒段</td>
              </tr>
              <tr className="border-b bg-amber-50">
                <td className="py-2 px-4 font-semibold">圆锥段斜边长</td>
                <td className="py-2 px-4 font-semibold">900.0</td>
                <td className="py-2 px-4 font-semibold">0.900</td>
                <td className="py-2 px-4 text-muted-foreground">输入参数</td>
              </tr>
              <tr className="border-b bg-amber-50">
                <td className="py-2 px-4 font-semibold">圆锥段轴向高度</td>
                <td className="py-2 px-4 font-semibold">{CONE_HEIGHT.toFixed(1)}</td>
                <td className="py-2 px-4 font-semibold">{CONE_HEIGHT.toFixed(3)}</td>
                <td className="py-2 px-4 text-muted-foreground">
                  √(900² − {(DELTA_R * 1000).toFixed(0)}²) = √785975
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4">圆锥大端内径</td>
                <td className="py-2 px-4">410.0</td>
                <td className="py-2 px-4">0.410</td>
                <td className="py-2 px-4 text-muted-foreground">与圆柱匹配</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4">圆锥小端内径</td>
                <td className="py-2 px-4">100.0</td>
                <td className="py-2 px-4">0.100</td>
                <td className="py-2 px-4 text-muted-foreground">与出水口匹配</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4">出水口长度</td>
                <td className="py-2 px-4">200.0</td>
                <td className="py-2 px-4">0.200</td>
                <td className="py-2 px-4 text-muted-foreground">沿轴向延伸</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4">出水口内径</td>
                <td className="py-2 px-4">100.0</td>
                <td className="py-2 px-4">0.100</td>
                <td className="py-2 px-4 text-muted-foreground">排料口</td>
              </tr>
              <tr>
                <td className="py-2 px-4">圆角半径</td>
                <td className="py-2 px-4">10.0</td>
                <td className="py-2 px-4">0.010</td>
                <td className="py-2 px-4 text-muted-foreground">过渡处平滑圆角</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

// Import DELTA_R for the table
const DELTA_R = (0.410 - 0.100) / 2;

function DimCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <div className="text-xl font-bold text-primary">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-[10px] text-muted-foreground/70">{detail}</div>
    </div>
  );
}
