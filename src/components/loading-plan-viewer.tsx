'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Line } from '@react-three/drei';
import * as THREE from 'three';

interface CargoItem3D {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
}

interface Container3D {
  length: number;
  width: number;
  height: number;
}

interface LoadingPlanViewerProps {
  container: Container3D;
  items: CargoItem3D[];
}

const COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

function ContainerBox({ container }: { container: Container3D }) {
  const { length: l, width: w, height: h } = container;
  const points: [number, number, number][] = [
    [0, 0, 0], [l, 0, 0], [l, w, 0], [0, w, 0],
    [0, 0, h], [l, 0, h], [l, w, h], [0, w, h],
  ];

  const edges: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];

  const linePoints = edges.map(([a, b]) => [points[a], points[b]]);

  return (
    <group>
      {/* Container edges */}
      {linePoints.map(([start, end], i) => (
        <Line
          key={i}
          points={[start as [number, number, number], end as [number, number, number]]}
          color="#94a3b8"
          lineWidth={1}
        />
      ))}
      {/* Floor semi-transparent */}
      <mesh position={[l / 2, w / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[l, w]} />
        <meshBasicMaterial color="#e2e8f0" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      {/* Container label */}
      <sprite position={[l / 2, w / 2, h + 0.3]} scale={[1.5, 0.4, 1]}>
        <spriteMaterial color="#64748b" />
      </sprite>
    </group>
  );
}

function CargoBox({ item, index }: { item: CargoItem3D; index: number }) {
  const color = COLORS[index % COLORS.length]!;
  const { length: l, width: w, height: h } = item;

  const centerX = item.positionX + l / 2;
  const centerY = item.positionY + w / 2;
  const centerZ = item.positionZ + h / 2;

  const rotX = THREE.MathUtils.degToRad(item.rotationX);
  const rotY = THREE.MathUtils.degToRad(item.rotationY);
  const rotZ = THREE.MathUtils.degToRad(item.rotationZ);

  return (
    <mesh position={[centerX, centerY, centerZ]} rotation={[rotX, rotY, rotZ]}>
      <boxGeometry args={[l, w, h]} />
      <meshStandardMaterial color={color} transparent opacity={0.8} />
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(l, w, h)]} />
        <lineBasicMaterial color="#1e293b" linewidth={1} />
      </lineSegments>
    </mesh>
  );
}

function Scene({ container, items }: LoadingPlanViewerProps) {
  const maxDim = Math.max(container.length, container.width, container.height);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 8]} intensity={0.8} />
      <directionalLight position={[-3, 5, -2]} intensity={0.3} />

      <OrbitControls
        target={[container.length / 2, container.width / 2, container.height / 2]}
        enableDamping
        dampingFactor={0.1}
      />

      <Grid
        position={[0, 0, -0.01]}
        args={[Math.ceil(maxDim * 1.5), Math.ceil(maxDim * 1.5)]}
        cellSize={1}
        cellThickness={1}
        cellColor="#cbd5e1"
        sectionSize={5}
        sectionThickness={2}
        sectionColor="#94a3b8"
        fadeDistance={50}
        infiniteGrid
      />

      <axesHelper args={[1]} />

      <ContainerBox container={container} />
      {items.map((item, i) => (
        <CargoBox key={item.id ?? i} item={item} index={i} />
      ))}
    </>
  );
}

export default function LoadingPlanViewer(props: LoadingPlanViewerProps) {
  return (
    <div className="h-[500px] w-full overflow-hidden rounded-xl border">
      <Canvas
        camera={{ position: [8, -8, 6], fov: 50, near: 0.1, far: 200 }}
        style={{ background: '#f8fafc' }}
      >
        <Suspense fallback={null}>
          <Scene {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}
