'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { CargoItem3D, Container3D, InteractionOptions } from '@/types/viewer';
import {
  findCollisions,
  constrainToContainer,
  isOutsideContainer,
  snapToGrid,
} from '@/features/viewer/collision';

interface UseCargoInteractionProps {
  items: CargoItem3D[];
  container: Container3D;
  options: InteractionOptions;
  onPositionChange: (itemId: string, x: number, y: number, z: number) => void;
  onItemRemove: (itemId: string) => void;
}

export function useCargoInteraction({
  items,
  container,
  options,
  onPositionChange,
  onItemRemove,
}: UseCargoInteractionProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [collisionIds, setCollisionIds] = useState<Set<string>>(new Set());
  const [willBeRemoved, setWillBeRemoved] = useState(false);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{
    x: number;
    y: number;
    z: number;
  } | null>(null);

  const dragItemRef = useRef<CargoItem3D | null>(null);
  const pointerDownPos = useRef({ x: 0, y: 0 });

  const selectItem = useCallback((itemId: string | null) => {
    setSelectedItemId(itemId);
    if (!itemId) setCollisionIds(new Set());
  }, []);

  const handlePointerDown = useCallback(
    (itemId: string, clientX: number, clientY: number) => {
      pointerDownPos.current = { x: clientX, y: clientY };
    },
    [],
  );

  const handlePointerUp = useCallback(
    (itemId: string, clientX: number, clientY: number) => {
      const dx = clientX - pointerDownPos.current.x;
      const dy = clientY - pointerDownPos.current.y;
      const moved = Math.sqrt(dx * dx + dy * dy) > 3;
      if (!moved && !draggedItemId) {
        setSelectedItemId((prev) => (prev === itemId ? null : itemId));
      }
    },
    [draggedItemId],
  );

  const startDrag = useCallback(
    (itemId: string) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;
      dragItemRef.current = item;
      setDraggedItemId(itemId);
      setDragPosition({
        x: item.positionX,
        y: item.positionY,
        z: item.positionZ,
      });
    },
    [items],
  );

  const onDragMove = useCallback(
    (newX: number, newY: number) => {
      if (!dragItemRef.current) return;

      let { x, y } = { x: newX, y: newY };
      let z = dragItemRef.current.positionZ;

      if (options.snapToGrid) {
        x = snapToGrid(x, options.gridSize);
        y = snapToGrid(y, options.gridSize);
      }

      if (options.constrainToContainer) {
        const c = constrainToContainer(
          { x, y, z },
          {
            length: dragItemRef.current.length,
            width: dragItemRef.current.width,
            height: dragItemRef.current.height,
          },
          container,
        );
        x = c.x;
        y = c.y;
        z = c.z;
      }

      setDragPosition({ x, y, z });

      // Update the item position for real-time preview
      onPositionChange(dragItemRef.current.id, x, y, z);

      // Check collisions against current items (excluding self)
      const previewItem: CargoItem3D = {
        ...dragItemRef.current,
        positionX: x,
        positionY: y,
        positionZ: z,
      };
      const collisions = findCollisions(previewItem, items);
      setCollisionIds(new Set(collisions));

      // Check if outside container
      const outside = isOutsideContainer(
        { x, y, z },
        {
          length: dragItemRef.current.length,
          width: dragItemRef.current.width,
          height: dragItemRef.current.height,
        },
        container,
      );
      setWillBeRemoved(outside && !options.constrainToContainer);
    },
    [options, container, items, onPositionChange],
  );

  const adjustZ = useCallback(
    (delta: number) => {
      if (!dragItemRef.current || !dragPosition) return;

      const step = options.snapToGrid ? options.gridSize : 0.05;
      let newZ = dragPosition.z + delta * step;

      newZ = Math.max(
        0,
        Math.min(
          newZ,
          container.height - dragItemRef.current.height,
        ),
      );

      setDragPosition((prev) =>
        prev ? { ...prev, z: newZ } : null,
      );
      onPositionChange(
        dragItemRef.current.id,
        dragPosition.x,
        dragPosition.y,
        newZ,
      );
    },
    [dragPosition, options, container, onPositionChange],
  );

  const endDrag = useCallback(() => {
    if (!dragItemRef.current) return;

    if (willBeRemoved) {
      onItemRemove(dragItemRef.current.id);
    }

    setDraggedItemId(null);
    setDragPosition(null);
    setWillBeRemoved(false);
    setCollisionIds(new Set());
    dragItemRef.current = null;
  }, [willBeRemoved, onItemRemove]);

  const handlePointerOver = useCallback((itemId: string) => {
    setHoveredItemId(itemId);
  }, []);
  const handlePointerOut = useCallback(() => {
    setHoveredItemId(null);
  }, []);

  return {
    selectedItemId,
    draggedItemId,
    collisionIds,
    willBeRemoved,
    hoveredItemId,
    dragPosition,
    selectItem,
    handlePointerDown,
    handlePointerUp,
    startDrag,
    onDragMove,
    adjustZ,
    endDrag,
    handlePointerOver,
    handlePointerOut,
  };
}
