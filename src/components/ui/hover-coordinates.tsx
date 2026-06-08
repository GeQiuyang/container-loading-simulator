'use client';

interface HoverCoordinatesProps {
  visible: boolean;
  position: { x: number; y: number; z: number } | null;
  itemName?: string;
  mode: 'hover' | 'drag' | 'none';
}

export function HoverCoordinates({
  visible,
  position,
  itemName,
  mode,
}: HoverCoordinatesProps) {
  if (!visible || !position) return null;

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-lg border bg-background/90 px-3 py-2 text-xs font-mono shadow backdrop-blur-sm">
      {itemName && (
        <div className="mb-1 font-medium text-foreground">{itemName}</div>
      )}
      <div className={mode === 'drag' ? 'text-blue-600' : 'text-muted-foreground'}>
        X: {position.x.toFixed(3)}m / Y: {position.y.toFixed(3)}m / Z:{' '}
        {position.z.toFixed(3)}m
      </div>
      {mode === 'drag' && (
        <div className="mt-1 text-[10px] text-muted-foreground">
          Scroll to adjust Z | Release outside to remove
        </div>
      )}
    </div>
  );
}
