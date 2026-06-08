'use client';

import { Suspense, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Canvas, useThree, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Grid, Line, Outlines } from '@react-three/drei';
import * as THREE from 'three';
import type { CargoItem3D, Container3D } from '@/types/viewer';
import { findCollisions, constrainToContainer, isOutsideContainer, snapToGrid } from '@/features/viewer/collision';

export type { CargoItem3D, Container3D } from '@/types/viewer';

interface LoadingPlanViewerProps {
  container: Container3D;
  items: CargoItem3D[];
  interactive?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
  constrainToContainer?: boolean;
  onItemsChange?: (items: CargoItem3D[]) => void;
}

const COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

// ── Container Box ─────────────────────────────────────────────────

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

  const linePoints = edges.map(([a, b]) => [points[a]!, points[b]!]);

  return (
    <group>
      {linePoints.map(([start, end], i) => (
        <Line
          key={i}
          points={[start as [number, number, number], end as [number, number, number]]}
          color="#94a3b8"
          lineWidth={1}
        />
      ))}
      <mesh position={[l / 2, w / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[l, w]} />
        <meshBasicMaterial color="#e2e8f0" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ── Cargo Box ─────────────────────────────────────────────────────

interface CargoBoxProps {
  item: CargoItem3D;
  index: number;
  isSelected: boolean;
  isDragging: boolean;
  isColliding: boolean;
  willBeRemoved: boolean;
  isHovered: boolean;
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
  onPointerUp: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOver: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut: (e: ThreeEvent<PointerEvent>) => void;
}

const CargoBox = ({
  item,
  index,
  isSelected,
  isDragging,
  isColliding,
  willBeRemoved,
  isHovered,
  onPointerDown,
  onPointerUp,
  onPointerOver,
  onPointerOut,
}: CargoBoxProps) => {
  const color = COLORS[index % COLORS.length]!;
  const { length: l, width: w, height: h } = item;

  const centerX = item.positionX + l / 2;
  const centerY = item.positionY + w / 2;
  const centerZ = item.positionZ + h / 2;

  const rotX = THREE.MathUtils.degToRad(item.rotationX);
  const rotY = THREE.MathUtils.degToRad(item.rotationY);
  const rotZ = THREE.MathUtils.degToRad(item.rotationZ);

  const materialColor = willBeRemoved ? '#ef4444' : isColliding ? '#f97316' : color;
  const materialOpacity = willBeRemoved ? 0.35 : isDragging ? 0.6 : isHovered ? 0.9 : 0.8;
  const edgeColor = isSelected ? '#2563eb' : willBeRemoved ? '#dc2626' : isColliding ? '#ea580c' : '#1e293b';
  const edgeWidth = isSelected ? 2 : 1;

  const boxGeo = useMemo(() => new THREE.BoxGeometry(l, w, h), [l, w, h]);

  return (
    <group>
      <mesh
        position={[centerX, centerY, centerZ]}
        rotation={[rotX, rotY, rotZ]}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      >
        <boxGeometry args={[l, w, h]} />
        <meshStandardMaterial
          color={materialColor}
          transparent
          opacity={materialOpacity}
        />
        <lineSegments>
          <edgesGeometry args={[boxGeo]} />
          <lineBasicMaterial color={edgeColor} linewidth={edgeWidth} />
        </lineSegments>
      </mesh>

      {/* Selection highlight */}
      {isSelected && !isDragging && (
        <Outlines
          position={[centerX, centerY, centerZ]}
          rotation={[rotX, rotY, rotZ]}
          thickness={3}
          color="#2563eb"
          screenspace
          transparent
          opacity={0.8}
        >
          <mesh>
            <boxGeometry args={[l, w, h]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        </Outlines>
      )}

      {/* Collision highlight */}
      {isColliding && !willBeRemoved && (
        <Outlines
          position={[centerX, centerY, centerZ]}
          rotation={[rotX, rotY, rotZ]}
          thickness={2}
          color="#f97316"
          screenspace
          transparent
          opacity={0.6}
        >
          <mesh>
            <boxGeometry args={[l, w, h]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        </Outlines>
      )}
    </group>
  );
};

// ── Scene ─────────────────────────────────────────────────────────

interface SceneProps {
  container: Container3D;
  items: CargoItem3D[];
  interactive: boolean;
  snapToGrid: boolean;
  gridSize: number;
  constrainEnabled: boolean;
  onItemsChange?: (items: CargoItem3D[]) => void;
}

function Scene({
  container,
  items: initialItems,
  interactive,
  snapToGrid: snapEnabled,
  gridSize,
  constrainEnabled,
  onItemsChange,
}: SceneProps) {
  const { gl, camera, raycaster } = useThree();
  const [localItems, setLocalItems] = useState(initialItems);

  // Sync external items when they change (only when not dragging)
  const isDragging = useRef(false);
  useEffect(() => {
    if (!isDragging.current) {
      setLocalItems(initialItems);
    }
  }, [initialItems]);

  // Interaction state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [collisionSet, setCollisionSet] = useState<Set<string>>(new Set());
  const [willRemove, setWillRemove] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Refs for drag state — updated during drag, read by event handlers
  const dragItemRef = useRef<CargoItem3D | null>(null);
  const pointerDownPos = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const intersection = useRef(new THREE.Vector3());

  // Refs for values that change during drag (avoid useEffect re-registration)
  const localItemsRef = useRef(localItems);
  localItemsRef.current = localItems;
  const willRemoveRef = useRef(willRemove);
  willRemoveRef.current = willRemove;
  const containerRef = useRef(container);
  containerRef.current = container;
  const snapEnabledRef = useRef(snapEnabled);
  snapEnabledRef.current = snapEnabled;
  const gridSizeRef = useRef(gridSize);
  gridSizeRef.current = gridSize;
  const constrainEnabledRef = useRef(constrainEnabled);
  constrainEnabledRef.current = constrainEnabled;
  const onItemsChangeRef = useRef(onItemsChange);
  onItemsChangeRef.current = onItemsChange;

  // ── Drag Plane Logic ──

  const getNDC = useCallback(
    (clientX: number, clientY: number): THREE.Vector2 => {
      const rect = gl.domElement.getBoundingClientRect();
      return new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
    },
    [gl],
  );

  const initDrag = useCallback(
    (itemId: string, event: ThreeEvent<PointerEvent>) => {
      const item = localItemsRef.current.find((i) => i.id === itemId);
      if (!item) return;

      // Don't set isDragging or draggedId yet — defer until actual movement
      dragItemRef.current = { ...item };

      dragPlane.current.set(
        new THREE.Vector3(0, 0, 1),
        -item.positionZ,
      );

      const ndc = getNDC(event.clientX, event.clientY);
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.ray.intersectPlane(
        dragPlane.current,
        intersection.current,
      );
      if (hit) {
        dragOffset.current = {
          x: intersection.current.x - item.positionX,
          y: intersection.current.y - item.positionY,
        };
      }

      (event.target as HTMLElement)?.setPointerCapture?.(event.pointerId);
    },
    [getNDC, raycaster, camera],
  );

  // ── Canvas-level drag events (stable — only set up once) ──

  useEffect(() => {
    if (!interactive) return;
    const canvas = gl.domElement;

    const onPointerMove = (e: PointerEvent) => {
      if (!dragItemRef.current) return;

      // Activate dragging only on actual movement (not on stationary click)
      if (!isDragging.current) {
        const dx = e.clientX - pointerDownPos.current.x;
        const dy = e.clientY - pointerDownPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) <= 3) return;
        isDragging.current = true;
        setDraggedId(dragItemRef.current.id);
      }

      // Capture id locally — React may call the state updater later,
      // after dragItemRef.current has been set to null by onPointerUp
      const itemId = dragItemRef.current.id;

      const ndc = getNDC(e.clientX, e.clientY);
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.ray.intersectPlane(
        dragPlane.current,
        intersection.current,
      );
      if (!hit) return;

      let x = intersection.current.x - dragOffset.current.x;
      let y = intersection.current.y - dragOffset.current.y;
      let z = dragItemRef.current.positionZ;
      const ctn = containerRef.current;

      if (snapEnabledRef.current) {
        x = snapToGrid(x, gridSizeRef.current);
        y = snapToGrid(y, gridSizeRef.current);
      }

      if (constrainEnabledRef.current) {
        const c = constrainToContainer(
          { x, y, z },
          { length: dragItemRef.current.length, width: dragItemRef.current.width, height: dragItemRef.current.height },
          ctn,
        );
        x = c.x; y = c.y; z = c.z;
      }

      // Update drag item position in ref
      dragItemRef.current = { ...dragItemRef.current, positionX: x, positionY: y, positionZ: z };

      // Update React state for visual
      setLocalItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? { ...it, positionX: x, positionY: y, positionZ: z }
            : it,
        ),
      );

      // Collision check
      const previewItem = dragItemRef.current;
      const others = localItemsRef.current.filter((it) => it.id !== previewItem.id);
      setCollisionSet(new Set(findCollisions(previewItem, others)));

      // Outside check
      setWillRemove(
        !constrainEnabledRef.current &&
          isOutsideContainer(
            { x, y, z },
            { length: previewItem.length, width: previewItem.width, height: previewItem.height },
            ctn,
          ),
      );
    };

    const onPointerUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;

      if (willRemoveRef.current && dragItemRef.current) {
        const newItems = localItemsRef.current.filter(
          (it) => it.id !== dragItemRef.current!.id,
        );
        setLocalItems(newItems);
        onItemsChangeRef.current?.(newItems);
      } else {
        onItemsChangeRef.current?.(localItemsRef.current);
      }

      setDraggedId(null);
      setWillRemove(false);
      setCollisionSet(new Set());
      dragItemRef.current = null;
    };

    const onWheel = (e: WheelEvent) => {
      if (!isDragging.current || !dragItemRef.current) return;
      e.preventDefault();

      const itemId = dragItemRef.current.id;

      const ctn = containerRef.current;
      const step = snapEnabledRef.current ? gridSizeRef.current : 0.05;
      let z = dragItemRef.current.positionZ + (e.deltaY > 0 ? -step : step);
      z = Math.max(0, Math.min(z, ctn.height - dragItemRef.current.height));

      dragPlane.current.set(new THREE.Vector3(0, 0, 1), -z);
      dragItemRef.current = { ...dragItemRef.current, positionZ: z };

      setLocalItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? { ...it, positionZ: z }
            : it,
        ),
      );
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
    // Only re-run if gl changes (canvas element changes) or interactive toggles
  }, [interactive, gl, getNDC, camera, raycaster]);

  // ── CargoBox Event Handlers ──

  const handlePointerDown = useCallback(
    (itemId: string) => (e: ThreeEvent<PointerEvent>) => {
      if (!interactive) return;
      e.stopPropagation();
      pointerDownPos.current = { x: e.clientX, y: e.clientY };
      initDrag(itemId, e);
      // Selection is handled in handlePointerUp on stationary click
    },
    [interactive, initDrag],
  );

  const handlePointerUp = useCallback(
    (itemId: string) => (e: ThreeEvent<PointerEvent>) => {
      if (!interactive) return;
      const dx = e.clientX - pointerDownPos.current.x;
      const dy = e.clientY - pointerDownPos.current.y;
      if (Math.sqrt(dx * dx + dy * dy) <= 3 && !isDragging.current) {
        // Stationary click — toggle selection and clear the leaked drag init state
        setSelectedId((prev) => (prev === itemId ? null : itemId));
        dragItemRef.current = null;
      }
    },
    [interactive],
  );

  const handlePointerOver = useCallback(
    (itemId: string) => () => {
      if (interactive) setHoveredId(itemId);
    },
    [interactive],
  );

  const handlePointerOut = useCallback(() => {
    if (interactive) setHoveredId(null);
  }, [interactive]);

  const handleCanvasClick = useCallback(() => {
    if (!isDragging.current) setSelectedId(null);
  }, []);

  // Current drag position for the vertical indicator line
  const currentDragPos = useMemo(() => {
    if (!draggedId) return null;
    const item = localItems.find((i) => i.id === draggedId);
    if (!item) return null;
    return { x: item.positionX, y: item.positionY, z: item.positionZ };
  }, [localItems, draggedId]);

  // ── Render ──

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
        enabled={!draggedId}
      />

      <Grid
        position={[0, 0, -0.01]}
        args={[Math.ceil(maxDim * 1.5), Math.ceil(maxDim * 1.5)]}
        cellSize={snapEnabled && interactive ? gridSize : 1}
        cellThickness={1}
        cellColor="#cbd5e1"
        sectionSize={5}
        sectionThickness={2}
        sectionColor="#94a3b8"
        fadeDistance={50}
        infiniteGrid
      />

      <axesHelper args={[1]} />

      {/* Invisible floor for deselection click */}
      <mesh
        position={[container.length / 2, container.width / 2, -0.005]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={handleCanvasClick}
        visible={false}
      >
        <planeGeometry args={[container.length + 20, container.width + 20]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      <ContainerBox container={container} />

      {localItems.map((item, i) => {
        if (!item) return null;
        const isSelected = selectedId === item.id;
        const isDragged = draggedId === item.id;
        return (
          <CargoBox
            key={item.id ?? i}
            item={item}
            index={i}
            isSelected={isSelected}
            isDragging={isDragged}
            isColliding={collisionSet.has(item.id)}
            willBeRemoved={willRemove && isDragged}
            isHovered={hoveredId === item.id}
            onPointerDown={handlePointerDown(item.id)}
            onPointerUp={handlePointerUp(item.id)}
            onPointerOver={handlePointerOver(item.id)}
            onPointerOut={handlePointerOut}
          />
        );
      })}

      {/* Vertical line from floor to item bottom during drag */}
      {draggedId && currentDragPos && (
        <Line
          points={[
            [currentDragPos.x, currentDragPos.y, 0],
            [currentDragPos.x, currentDragPos.y, currentDragPos.z],
          ]}
          color={willRemove ? '#ef4444' : '#3b82f6'}
          lineWidth={1}
        />
      )}
    </>
  );
}

// ── Exported Component ────────────────────────────────────────────

export default function LoadingPlanViewer({
  container,
  items,
  interactive = false,
  snapToGrid: externalSnap,
  gridSize: externalGridSize,
  constrainToContainer: externalConstrain,
  onItemsChange,
}: LoadingPlanViewerProps) {
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(0.05);
  const [constrainEnabled, setConstrainEnabled] = useState(true);

  const snap = externalSnap ?? snapToGrid;
  const gs = externalGridSize ?? gridSize;
  const constrain = externalConstrain ?? constrainEnabled;

  // Find selected item name for overlay
  const localItemsRef = useRef(items);
  // We track the dragged item via a simple state since we can't access Scene's internal state from outside easily
  const [draggedItemName, setDraggedItemName] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number; z: number } | null>(null);

  // Wrap onItemsChange to also track drag state for HTML overlay
  const handleItemsChange = useCallback(
    (newItems: CargoItem3D[]) => {
      onItemsChange?.(newItems);
    },
    [onItemsChange],
  );

  return (
    <div className="relative">
      {/* Toolbar */}
      {interactive && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border bg-card p-2 text-xs">
          <button
            type="button"
            onClick={() => setSnapToGrid((s) => !s)}
            className={`rounded px-2 py-1 text-xs font-medium ${
              snap ? 'bg-primary text-primary-foreground' : 'border'
            }`}
          >
            Snap: {snap ? 'ON' : 'OFF'}
          </button>
          {snap && (
            <select
              value={gs}
              onChange={(e) => setGridSize(Number(e.target.value))}
              className="rounded border px-1 py-1 text-xs"
            >
              <option value={0.01}>0.01m</option>
              <option value={0.05}>0.05m</option>
              <option value={0.1}>0.1m</option>
              <option value={0.5}>0.5m</option>
            </select>
          )}
          <button
            type="button"
            onClick={() => setConstrainEnabled((c) => !c)}
            className={`rounded px-2 py-1 text-xs font-medium ${
              constrain ? 'bg-primary text-primary-foreground' : 'border'
            }`}
          >
            Constrain: {constrain ? 'ON' : 'OFF'}
          </button>
          <div className="ml-auto text-muted-foreground">
            {items.length} items | Click to select, drag to move, scroll to adjust height
          </div>
        </div>
      )}

      <div className="h-[500px] w-full overflow-hidden rounded-xl border">
        <Canvas
          camera={{ position: [8, -8, 6], fov: 50, near: 0.1, far: 200 }}
          style={{ background: '#f8fafc' }}
        >
          <Suspense fallback={null}>
            <Scene
              container={container}
              items={items}
              interactive={interactive}
              snapToGrid={snap}
              gridSize={gs}
              constrainEnabled={constrain}
              onItemsChange={handleItemsChange}
            />
          </Suspense>
        </Canvas>

        {/* HTML overlay for active drag info */}
        {interactive && dragPos && (
          <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-lg border bg-background/90 px-3 py-2 text-xs font-mono shadow backdrop-blur-sm">
            {draggedItemName && (
              <div className="mb-1 font-medium text-foreground">
                {draggedItemName}
              </div>
            )}
            <div className="text-blue-600">
              X: {dragPos.x.toFixed(3)}m / Y: {dragPos.y.toFixed(3)}m / Z:{' '}
              {dragPos.z.toFixed(3)}m
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              Scroll to adjust Z | Release outside to remove
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
