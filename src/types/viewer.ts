export interface CargoItem3D {
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

export interface Container3D {
  length: number;
  width: number;
  height: number;
}

export interface DragState {
  itemId: string;
  offset: { x: number; y: number };
  dragPlaneZ: number;
  itemDims: { length: number; width: number; height: number };
}

export interface InteractionOptions {
  snapToGrid: boolean;
  gridSize: number;
  constrainToContainer: boolean;
}

export interface InteractionCallbacks {
  onPositionChange: (itemId: string, x: number, y: number, z: number) => void;
  onItemRemove: (itemId: string) => void;
  onSelect: (itemId: string | null) => void;
}
