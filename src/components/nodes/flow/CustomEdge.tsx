/**
 * CustomEdge - React Flow edge component with animations
 */

import React from 'react';
import { EdgeProps, getBezierPath, getStraightPath } from 'reactflow';
import './CustomEdge.css';

export const CustomEdge: React.FC<EdgeProps> = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  id,
}) => {
  const isAligned = Math.abs(sourceX - targetX) < 24 || Math.abs(sourceY - targetY) < 24;
  const [edgePath] = isAligned
    ? getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
      })
    : getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      });

  const gradientId = `edgeGradient-${id}`;

  return (
    <g className={`custom-edge ${selected ? 'selected' : ''}`}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.6 }} />
          <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0.8 }} />
        </linearGradient>
      </defs>

      {/* Main edge path */}
      <path d={edgePath} className="edge-path" stroke={`url(#${gradientId})`} />

      {/* Animated flow indicator */}
      <path d={edgePath} className="edge-flow" stroke={`url(#${gradientId})`} />

      {/* Selection indicator */}
      {selected && <path d={edgePath} className="edge-selection" />}

      {/* Invisible interaction path to grab the edge easily */}
      <path d={edgePath} className="edge-interaction" strokeWidth={30} fill="none" stroke="transparent" style={{ pointerEvents: 'stroke', cursor: 'grab' }} />
    </g>
  );
};
