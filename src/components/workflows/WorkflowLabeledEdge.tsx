'use client'

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react'
import type { WorkflowEdgeData } from '@/features/workflows/editor-model'

const conditionColors: Record<string, string> = {
  always: 'var(--on-surface-variant)',
  success: 'var(--status-active)',
  failure: 'var(--status-error, #ef4444)',
  approval: 'var(--tertiary)',
}

export function WorkflowLabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps) {
  const edgeData = data as unknown as WorkflowEdgeData | undefined
  const condition = edgeData?.conditionType ?? 'always'

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  const color = conditionColors[condition] ?? conditionColors.always

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: selected ? 'var(--primary)' : color,
          strokeWidth: selected ? 2.5 : 1.5,
          opacity: selected ? 1 : 0.7,
        }}
      />
      {condition !== 'always' && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-auto absolute rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              background: 'var(--surface-container)',
              color,
              border: `1px solid ${color}`,
            }}
          >
            {condition}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
