'use client';

import { Button } from '@/components/ui/button';

interface InteractionToolbarProps {
  snapToGrid: boolean;
  onToggleSnap: () => void;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  constrainToContainer: boolean;
  onToggleConstrain: () => void;
  selectedItemId: string | null;
  itemCount: number;
}

export function InteractionToolbar({
  snapToGrid,
  onToggleSnap,
  gridSize,
  onGridSizeChange,
  constrainToContainer,
  onToggleConstrain,
  selectedItemId,
  itemCount,
}: InteractionToolbarProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card p-2 text-xs">
      <Button
        variant={snapToGrid ? 'default' : 'outline'}
        size="sm"
        onClick={onToggleSnap}
      >
        Snap: {snapToGrid ? 'ON' : 'OFF'}
      </Button>
      {snapToGrid && (
        <select
          value={gridSize}
          onChange={(e) => onGridSizeChange(Number(e.target.value))}
          className="rounded border px-1 py-1 text-xs"
        >
          <option value={0.01}>0.01m</option>
          <option value={0.05}>0.05m</option>
          <option value={0.1}>0.1m</option>
          <option value={0.5}>0.5m</option>
        </select>
      )}
      <Button
        variant={constrainToContainer ? 'default' : 'outline'}
        size="sm"
        onClick={onToggleConstrain}
      >
        Constrain: {constrainToContainer ? 'ON' : 'OFF'}
      </Button>
      <div className="ml-auto text-muted-foreground">
        {selectedItemId
          ? `Selected: ${selectedItemId.slice(0, 8)}...`
          : `${itemCount} items (click to select, drag to move)`}
      </div>
    </div>
  );
}
