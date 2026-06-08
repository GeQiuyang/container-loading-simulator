import * as THREE from 'three';
import type { CargoItem3D } from '@/types/viewer';

/** Convert bottom-corner position to mesh center (used by CargoBox). */
export function bottomCornerToCenter(item: CargoItem3D): THREE.Vector3 {
  return new THREE.Vector3(
    item.positionX + item.length / 2,
    item.positionY + item.width / 2,
    item.positionZ + item.height / 2,
  );
}

/** Convert mesh center back to bottom-corner position. */
export function centerToBottomCorner(
  center: THREE.Vector3,
  dims: { length: number; width: number; height: number },
): { x: number; y: number; z: number } {
  return {
    x: center.x - dims.length / 2,
    y: center.y - dims.width / 2,
    z: center.z - dims.height / 2,
  };
}
