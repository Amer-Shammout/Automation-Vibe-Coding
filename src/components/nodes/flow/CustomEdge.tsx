/**
 * CustomEdge - React Flow edge component with animations
 */

import React from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';
import './CustomEdge.css';

export const CustomEdge: React.FC<EdgeProps> = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <g className={`custom-edge ${selected ? 'selected' : ''}`}>
      <defs>
        <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.6 }} />
          <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0.8 }} />
        </linearGradient>
      </defs>

      {/* Main edge path */}
      <path d={edgePath} className="edge-path" stroke="url(#edgeGradient)" />

      {/* Animated flow indicator */}
      <path d={edgePath} className="edge-flow" stroke="url(#edgeGradient)" />

      {/* Selection indicator */}
      {selected && <path d={edgePath} className="edge-selection" />}
    </g>
  );
};
