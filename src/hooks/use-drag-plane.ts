'use client';

import { useCallback, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface DragPlaneHandles {
  startDrag: (
    itemId: string,
    pointer: { clientX: number; clientY: number },
    itemPos: { x: number; y: number; z: number },
    itemDims: { length: number; width: number; height: number },
    onMove: (x: number, y: number) => void,
    onEnd: () => void,
  ) => void;
  updateDrag: (clientX: number, clientY: number) => void;
  updateDragPlaneZ: (z: number) => void;
  endDrag: () => void;
  getDragState: () => { active: boolean; itemId: string | null };
}

export function useDragPlane(): DragPlaneHandles {
  const { camera, raycaster } = useThree();

  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const intersection = useRef(new THREE.Vector3());
  const offset = useRef({ x: 0, y: 0 });
  const active = useRef(false);
  const activeItemId = useRef<string | null>(null);
  const onMoveRef = useRef<((x: number, y: number) => void) | null>(null);
  const onEndRef = useRef<(() => void) | null>(null);

  const startDrag = useCallback(
    (
      itemId: string,
      pointer: { clientX: number; clientY: number },
      itemPos: { x: number; y: number; z: number },
      _itemDims: { length: number; width: number; height: number },
      onMove: (x: number, y: number) => void,
      onEnd: () => void,
    ) => {
      active.current = true;
      activeItemId.current = itemId;
      onMoveRef.current = onMove;
      onEndRef.current = onEnd;

      // Set drag plane at item's bottom Z
      dragPlane.current.set(new THREE.Vector3(0, 0, 1), -itemPos.z);

      // Compute pointer ray intersection with drag plane
      const ndc = getNDC(pointer.clientX, pointer.clientY);
      if (ndc) {
        raycaster.setFromCamera(ndc, camera);
        const hit = raycaster.ray.intersectPlane(
          dragPlane.current,
          intersection.current,
        );
        if (hit) {
          offset.current = {
            x: intersection.current.x - itemPos.x,
            y: intersection.current.y - itemPos.y,
          };
        }
      }
    },
    [camera, raycaster],
  );

  const getNDC = useCallback(
    (clientX: number, clientY: number): THREE.Vector2 | null => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
    },
    [],
  );

  const updateDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!active.current || !onMoveRef.current) return;

      const ndc = getNDC(clientX, clientY);
      if (!ndc) return;

      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.ray.intersectPlane(
        dragPlane.current,
        intersection.current,
      );
      if (hit) {
        const newX = intersection.current.x - offset.current.x;
        const newY = intersection.current.y - offset.current.y;
        onMoveRef.current(newX, newY);
      }
    },
    [camera, raycaster, getNDC],
  );

  const updateDragPlaneZ = useCallback((z: number) => {
    dragPlane.current.set(new THREE.Vector3(0, 0, 1), -z);
  }, []);

  const endDrag = useCallback(() => {
    active.current = false;
    activeItemId.current = null;
    onEndRef.current?.();
    onMoveRef.current = null;
    onEndRef.current = null;
  }, []);

  const getDragState = useCallback(() => {
    return { active: active.current, itemId: activeItemId.current };
  }, []);

  return {
    startDrag,
    updateDrag,
    updateDragPlaneZ,
    endDrag,
    getDragState,
  };
}
