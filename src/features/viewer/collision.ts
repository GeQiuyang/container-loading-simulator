import * as THREE from 'three';
import type { CargoItem3D, Container3D } from '@/types/viewer';

/**
 * Compute world-space Axis-Aligned Bounding Box for a cargo item.
 * For rotated items, transforms all 8 corners by the rotation matrix and re-expands to AABB.
 */
export function createWorldAABB(item: CargoItem3D): THREE.Box3 {
  const { length: l, width: w, height: h } = item;
  const half = new THREE.Vector3(l / 2, w / 2, h / 2);
  const center = new THREE.Vector3(
    item.positionX + l / 2,
    item.positionY + w / 2,
    item.positionZ + h / 2,
  );

  // Build 8 corners in local space (centered at origin)
  const corners: THREE.Vector3[] = [];
  for (let ix = -1; ix <= 1; ix += 2) {
    for (let iy = -1; iy <= 1; iy += 2) {
      for (let iz = -1; iz <= 1; iz += 2) {
        corners.push(new THREE.Vector3(ix * half.x, iy * half.y, iz * half.z));
      }
    }
  }

  // Apply rotation + translation to each corner
  if (item.rotationX !== 0 || item.rotationY !== 0 || item.rotationZ !== 0) {
    const euler = new THREE.Euler(
      THREE.MathUtils.degToRad(item.rotationX),
      THREE.MathUtils.degToRad(item.rotationY),
      THREE.MathUtils.degToRad(item.rotationZ),
    );
    const quat = new THREE.Quaternion().setFromEuler(euler);
    for (const c of corners) {
      c.applyQuaternion(quat).add(center);
    }
  } else {
    for (const c of corners) {
      c.add(center);
    }
  }

  // Compute AABB from all corners
  return new THREE.Box3().setFromPoints(corners);
}

/**
 * Find IDs of all items that collide with the given item.
 */
export function findCollisions(
  item: CargoItem3D,
  allItems: CargoItem3D[],
): string[] {
  const itemBox = createWorldAABB(item);
  return allItems
    .filter((other) => other.id !== item.id)
    .filter((other) => itemBox.intersectsBox(createWorldAABB(other)))
    .map((o) => o.id);
}

/**
 * Constrain a bottom-corner position so the item stays fully inside the container.
 */
export function constrainToContainer(
  pos: { x: number; y: number; z: number },
  dims: { length: number; width: number; height: number },
  container: Container3D,
): { x: number; y: number; z: number } {
  return {
    x: Math.max(0, Math.min(pos.x, container.length - dims.length)),
    y: Math.max(0, Math.min(pos.y, container.width - dims.width)),
    z: Math.max(0, Math.min(pos.z, container.height - dims.height)),
  };
}

/**
 * Check if an item is clearly outside the container (for drag-out removal).
 * Uses a 1m margin so casual overshoot doesn't trigger removal.
 */
export function isOutsideContainer(
  pos: { x: number; y: number; z: number },
  dims: { length: number; width: number; height: number },
  container: Container3D,
  margin = 1.0,
): boolean {
  return (
    pos.x + dims.length < -margin ||
    pos.x > container.length + margin ||
    pos.y + dims.width < -margin ||
    pos.y > container.width + margin ||
    pos.z < -margin
  );
}

/** Snap a value to the nearest grid increment. */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}
