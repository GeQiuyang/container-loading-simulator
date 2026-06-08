'use client';

import { Suspense, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';

// ── Types ──────────────────────────────────────────────────────────

interface PipeData {
  id: number;
  x: number;
  y: number;
  z: number;
  layer: number;
  row: number;
}

export interface PipeParams {
  od: number;    // outer diameter (m)
  wall: number;  // wall thickness (m)
  length: number; // pipe length (m)
}

export interface ContainerDims {
  length: number;
  width: number;
  height: number;
}

export interface Stats {
  totalPipes: number;
  perLength: number;
  totalRows: number;
  perSection: number;
  oddRows: number;
  evenRows: number;
  perOdd: number;
  perEven: number;
  lengthUtilization: string;
  widthUtilization: string;
  heightUtilization: string;
  volumeUtilization: string;
  pipeVolume: string;
  pipeMass: string;
  totalMass: string;
  xGap: string;
}

// ── Calculation Helpers (pure functions) ───────────────────────────

export function computePipeLayout(params: PipeParams, container: ContainerDims): { pipes: PipeData[]; stats: Stats } {
  const { od, length } = params;
  const radius = od / 2;
  const vertSpacing = od * (Math.sqrt(3) / 2);
  const perLength = Math.floor(container.length / length);
  const xStart = length / 2;

  const pipes: PipeData[] = [];
  let id = 0;

  let row = 0;
  while (true) {
    const z = radius + row * vertSpacing;
    if (z + radius > container.height) break;
    const isOdd = row % 2 === 0;
    const perRow = Math.floor(container.width / od);
    const count = isOdd ? perRow : Math.max(0, perRow - 1);
    const rowWidth = isOdd ? count * od : (count - 1) * od + od;
    const yStart = (container.width - rowWidth) / 2 + radius;
    for (let i = 0; i < count; i++) {
      const y = yStart + i * od;
      for (let j = 0; j < perLength; j++) {
        pipes.push({ id: id++, x: xStart + j * length, y, z, layer: j, row });
      }
    }
    row++;
  }

  return { pipes, stats: computeStats(params, container, pipes, perLength, row) };
}

export function computeStats(
  params: PipeParams, container: ContainerDims,
  pipes: PipeData[], perLength: number, totalRows: number,
): Stats {
  const { od, wall, length } = params;
  const radius = od / 2;
  const innerRadius = radius - wall;
  const perOdd = Math.floor(container.width / od);
  const perEven = Math.max(0, perOdd - 1);
  const oddRows = Math.ceil(totalRows / 2);
  const evenRows = Math.floor(totalRows / 2);
  const volPerPipe = Math.PI * radius ** 2 * length;
  const steelVolPerPipe = Math.PI * (radius ** 2 - innerRadius ** 2) * length;

  return {
    totalPipes: pipes.length,
    perLength,
    totalRows,
    perSection: oddRows * perOdd + evenRows * perEven,
    oddRows, evenRows, perOdd, perEven,
    lengthUtilization: ((perLength * length) / container.length * 100).toFixed(1),
    widthUtilization: ((perOdd * od) / container.width * 100).toFixed(1),
    heightUtilization: ((radius + (totalRows - 1) * od * (Math.sqrt(3) / 2) + radius) / container.height * 100).toFixed(1),
    volumeUtilization: ((pipes.length * volPerPipe) / (container.length * container.width * container.height) * 100).toFixed(1),
    pipeVolume: volPerPipe.toFixed(4),
    pipeMass: (steelVolPerPipe * 7850).toFixed(1),
    totalMass: (steelVolPerPipe * 7850 * pipes.length / 1000).toFixed(1),
    xGap: (container.length - perLength * length).toFixed(3),
  };
}

// ── Container Wireframe ────────────────────────────────────────────

function ContainerBox({ container }: { container: ContainerDims }) {
  const { length: l, width: w, height: h } = container;
  const pts: [number, number, number][] = [
    [0,0,0],[l,0,0],[l,w,0],[0,w,0],
    [0,0,h],[l,0,h],[l,w,h],[0,w,h],
  ];
  const edges: [number,number][] = [
    [0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7],
  ];
  return (
    <group>
      {edges.map(([a,b],i) => (
        <Line key={i} points={[pts[a]!, pts[b]!] as [number,number,number][]} color="#94a3b8" lineWidth={1} />
      ))}
      <mesh position={[l/2,w/2,0]} rotation={[-Math.PI/2,0,0]}>
        <planeGeometry args={[l,w]} />
        <meshBasicMaterial color="#e2e8f0" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ── Pipe Mesh ──────────────────────────────────────────────────────

const LAYER_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16'];

interface PipeMeshProps {
  pipe: PipeData;
  color: string;
  isSelected: boolean;
  isDragging: boolean;
  isColliding: boolean;
  willRemove: boolean;
  radius: number;
  length: number;
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
  onPointerUp: (e: ThreeEvent<PointerEvent>) => void;
}

function PipeMesh({
  pipe, color, isSelected, isDragging, isColliding, willRemove,
  radius, length,
  onPointerDown, onPointerUp,
}: PipeMeshProps) {
  const matColor = willRemove ? '#ef4444' : isColliding ? '#f97316' : isSelected ? '#60a5fa' : color;
  const opacity = willRemove ? 0.3 : isDragging ? 0.55 : 0.82;
  const emissive = isSelected ? '#2563eb' : isColliding ? '#c2410c' : '#000000';
  const emissiveIntensity = (isSelected || isColliding) ? 0.35 : 0;

  return (
    <group position={[pipe.x, pipe.y, pipe.z]} rotation={[0, 0, -Math.PI / 2]}>
      <mesh onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        <cylinderGeometry args={[radius, radius, length, 48, 1, false]} />
        <meshStandardMaterial color={matColor} emissive={emissive} emissiveIntensity={emissiveIntensity}
          metalness={0.6} roughness={0.3} side={THREE.DoubleSide} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

// ── Interactive Scene ──────────────────────────────────────────────

interface SceneProps {
  initialPipes: PipeData[];
  params: PipeParams;
  container: ContainerDims;
}

function Scene({ initialPipes, params, container }: SceneProps) {
  const { gl, camera, raycaster } = useThree();
  const [pipes, setPipes] = useState(initialPipes);
  const { od, length } = params;
  const radius = od / 2;

  // Sync when initialPipes changes externally
  useEffect(() => { setPipes(initialPipes); }, [initialPipes]);

  // Interaction state
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [collisionSet, setCollisionSet] = useState<Set<number>>(new Set());
  const [willRemove, setWillRemove] = useState(false);

  // Drag refs
  const isDragging = useRef(false);
  const dragItemRef = useRef<PipeData | null>(null);
  const pointerDownPos = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const intersection = useRef(new THREE.Vector3());
  const pipesRef = useRef(pipes); pipesRef.current = pipes;
  const willRemoveRef = useRef(willRemove); willRemoveRef.current = willRemove;
  const containerRef = useRef(container); containerRef.current = container;
  const radiusRef = useRef(radius); radiusRef.current = radius;
  const lengthRef = useRef(length); lengthRef.current = length;
  const odRef = useRef(od); odRef.current = od;

  const getNDC = useCallback((cx: number, cy: number): THREE.Vector2 => {
    const rect = gl.domElement.getBoundingClientRect();
    return new THREE.Vector2(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
  }, [gl]);

  const initDrag = useCallback((pipeId: number, e: ThreeEvent<PointerEvent>) => {
    const pipe = pipesRef.current.find(p => p.id === pipeId);
    if (!pipe) return;
    dragItemRef.current = { ...pipe };
    const r = radiusRef.current;
    dragPlane.current.set(new THREE.Vector3(0, 0, 1), -(pipe.z - r));
    const ndc = getNDC(e.clientX, e.clientY);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.ray.intersectPlane(dragPlane.current, intersection.current);
    if (hit) dragOffset.current = { x: intersection.current.x - pipe.x, y: intersection.current.y - pipe.y };
    (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
  }, [getNDC, raycaster, camera]);

  useEffect(() => {
    const canvas = gl.domElement;
    const onPointerMove = (e: PointerEvent) => {
      if (!dragItemRef.current) return;
      if (!isDragging.current) {
        const dx = e.clientX - pointerDownPos.current.x;
        const dy = e.clientY - pointerDownPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) <= 3) return;
        isDragging.current = true;
        setDraggedId(dragItemRef.current.id);
      }
      const itemId = dragItemRef.current.id;
      const ndc = getNDC(e.clientX, e.clientY);
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.ray.intersectPlane(dragPlane.current, intersection.current);
      if (!hit) return;
      const ctn = containerRef.current;
      const r = radiusRef.current;
      const l = lengthRef.current;
      const d = odRef.current;
      let x = intersection.current.x - dragOffset.current.x;
      let y = intersection.current.y - dragOffset.current.y;
      const z = dragItemRef.current.z;
      x = Math.max(l / 2, Math.min(x, ctn.length - l / 2));
      y = Math.max(r, Math.min(y, ctn.width - r));
      dragItemRef.current = { ...dragItemRef.current, x, y, z };
      setPipes(prev => prev.map(p => p.id === itemId ? { ...p, x, y, z } : p));
      // Collision
      const preview = dragItemRef.current;
      const others = pipesRef.current.filter(p => p.id !== preview.id);
      const colliding = new Set<number>();
      for (const o of others) {
        const axMin = preview.x - l/2, axMax = preview.x + l/2;
        const bxMin = o.x - l/2, bxMax = o.x + l/2;
        if (axMax <= bxMin || bxMax <= axMin) continue;
        const dy = preview.y - o.y, dz = preview.z - o.z;
        if (Math.sqrt(dy*dy + dz*dz) < d) colliding.add(o.id);
      }
      setCollisionSet(colliding);
      setWillRemove(
        x + l/2 < -1 || x - l/2 > ctn.length + 1 ||
        y + r < -1 || y - r > ctn.width + 1 || preview.z < -1
      );
    };
    const onPointerUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      if (willRemoveRef.current && dragItemRef.current) {
        setPipes(prev => prev.filter(p => p.id !== dragItemRef.current!.id));
      }
      setDraggedId(null); setWillRemove(false); setCollisionSet(new Set());
      dragItemRef.current = null;
    };
    const onWheel = (e: WheelEvent) => {
      if (!isDragging.current || !dragItemRef.current) return;
      e.preventDefault();
      const itemId = dragItemRef.current.id;
      const step = 0.05;
      const r = radiusRef.current;
      const ctn = containerRef.current;
      let z = dragItemRef.current.z + (e.deltaY > 0 ? -step : step);
      z = Math.max(r, Math.min(z, ctn.height - r));
      dragPlane.current.set(new THREE.Vector3(0, 0, 1), -(z - r));
      dragItemRef.current = { ...dragItemRef.current, z };
      setPipes(prev => prev.map(p => p.id === itemId ? { ...p, z } : p));
    };
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [gl, getNDC, camera, raycaster]);

  const handlePointerDown = useCallback((pipeId: number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    initDrag(pipeId, e);
  }, [initDrag]);

  const handlePointerUp = useCallback((pipeId: number) => (e: ThreeEvent<PointerEvent>) => {
    const dx = e.clientX - pointerDownPos.current.x;
    const dy = e.clientY - pointerDownPos.current.y;
    if (Math.sqrt(dx*dx + dy*dy) <= 3 && !isDragging.current) {
      setSelectedId(prev => prev === pipeId ? null : pipeId);
      dragItemRef.current = null;
    }
  }, []);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 8]} intensity={0.8} />
      <OrbitControls target={[container.length/2, container.width/2, container.height/2]}
        enableDamping dampingFactor={0.1} enabled={!draggedId} />
      <ContainerBox container={container} />
      {pipes.map(pipe => {
        const isSel = selectedId === pipe.id;
        const isDrg = draggedId === pipe.id;
        return (
          <PipeMesh key={pipe.id} pipe={pipe}
            color={LAYER_COLORS[pipe.layer % LAYER_COLORS.length]!}
            isSelected={isSel} isDragging={isDrg}
            isColliding={collisionSet.has(pipe.id)}
            willRemove={willRemove && isDrg}
            radius={radius} length={length}
            onPointerDown={handlePointerDown(pipe.id)}
            onPointerUp={handlePointerUp(pipe.id)}
          />
        );
      })}
    </>
  );
}

// ── Exported Component ─────────────────────────────────────────────

interface PipeStackingViewerProps {
  params: PipeParams;
  container: ContainerDims;
}

export default function PipeStackingViewer({ params, container }: PipeStackingViewerProps) {
  const { pipes, stats } = useMemo(
    () => computePipeLayout(params, container),
    [params.od, params.wall, params.length, container.length, container.width, container.height],
  );

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard value={stats.totalPipes} label="Total Pipes" color="text-primary" />
        <StatCard value={stats.perLength} label="Per Length Stack" color="text-green-600" />
        <StatCard value={stats.perSection} label="Per Cross-Section" color="text-blue-600" />
        <StatCard value={stats.totalMass} label="Total Mass (tons)" color="text-amber-600" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 rounded-lg border bg-card p-2 text-xs text-muted-foreground">
        Click to select, drag to move, scroll to adjust height | Drag outside to remove
      </div>

      {/* 3D viewer */}
      <div className="h-[550px] w-full overflow-hidden rounded-xl border">
        <Canvas camera={{ position: [8, -8, 6], fov: 50, near: 0.1, far: 200 }}
          style={{ background: '#f8fafc' }}>
          <Suspense fallback={null}>
            <Scene initialPipes={pipes} params={params} container={container} />
          </Suspense>
        </Canvas>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground">
        <DetailCard title="Pipe Specs" items={[
          `OD: ${(params.od*1000).toFixed(0)}mm`,
          `Wall: ${(params.wall*1000).toFixed(2)}mm`,
          `ID: ${((params.od-2*params.wall)*1000).toFixed(2)}mm`,
          `Length: ${(params.length*1000).toFixed(0)}mm`,
          `Mass: ${stats.pipeMass} kg each`,
        ]} />
        <DetailCard title="Container" items={[
          `40GP: ${container.length}×${container.width}×${container.height}m`,
          `Volume: ${(container.length*container.width*container.height).toFixed(1)} m³`,
          `Length gap: ${stats.xGap}m (${(Number(stats.xGap)*1000).toFixed(0)}mm)`,
        ]} />
        <DetailCard title="Packing Layout" items={[
          `${stats.totalRows} rows: ${stats.oddRows}×${stats.perOdd} + ${stats.evenRows}×${stats.perEven}`,
          `${stats.perLength} layers along length (X)`,
          `Hexagonal close packing`,
        ]} />
        <DetailCard title="Utilization" items={[
          `Length: ${stats.lengthUtilization}%`,
          `Width: ${stats.widthUtilization}%`,
          `Height: ${stats.heightUtilization}%`,
          `Volume: ${stats.volumeUtilization}%`,
        ]} />
      </div>
    </div>
  );
}

function StatCard({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function DetailCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="font-medium text-foreground mb-1">{title}</div>
      {items.map((item, i) => <div key={i}>{item}</div>)}
    </div>
  );
}
