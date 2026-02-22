import type { ReactElement } from "react";

import { cn } from "../../utils";

export interface FloorGridProps {
  width: number;
  height: number;
  cellSize: number;
  showGrid: boolean;
  className?: string;
}

export const FloorGrid = ({ width, height, cellSize, showGrid, className }: FloorGridProps): ReactElement => {
  if (!showGrid) {
    return <div className={cn("absolute inset-0", className)} style={{ width, height }} />;
  }

  const cols = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);

  return (
    <div
      className={cn("absolute left-0 top-0", className)}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundImage: `
          linear-gradient(to right, var(--color-border-muted) 1px, transparent 1px),
          linear-gradient(to bottom, var(--color-border-muted) 1px, transparent 1px)
        `,
        backgroundSize: `${cellSize}px ${cellSize}px`,
      }}
      aria-hidden="true"
    >
      <svg width={width} height={height} className="pointer-events-none" aria-hidden="true">
        {Array.from({ length: cols + 1 }, (_, i) => (
          <line
            key={`v-${i}`}
            x1={i * cellSize}
            y1={0}
            x2={i * cellSize}
            y2={height}
            stroke="var(--color-border-muted)"
            strokeWidth="1"
          />
        ))}
        {Array.from({ length: rows + 1 }, (_, i) => (
          <line
            key={`h-${i}`}
            x1={0}
            y1={i * cellSize}
            x2={width}
            y2={i * cellSize}
            stroke="var(--color-border-muted)"
            strokeWidth="1"
          />
        ))}
      </svg>
    </div>
  );
};
