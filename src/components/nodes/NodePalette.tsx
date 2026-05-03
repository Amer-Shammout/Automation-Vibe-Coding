/**
 * NodePalette - Palette for available nodes
 */

import React from 'react';
import { Play, Palette, FileText } from '../icons';

interface NodeTemplate {
  id: string;
  name: string;
  category: string;
  icon?: string;
  type?: string;
  description?: string;
}

interface NodePaletteProps {
  nodes: NodeTemplate[];
  interactive?: boolean;
  onAddNode?: (nodeId: string) => void;
}

const getIconComponent = (iconName?: string) => {
  switch (iconName) {
    case 'palette':
      return <Palette size={20} strokeWidth={2} />;
    case 'file-text':
      return <FileText size={20} strokeWidth={2} />;
    case 'play':
      return <Play size={20} strokeWidth={2} />;
    default:
      return <Palette size={20} strokeWidth={2} />;
  }
};

export const NodePalette: React.FC<NodePaletteProps> = ({ nodes, interactive = false, onAddNode }) => {
  return (
    <div className="glass-palette">
      <div className="glass-palette-grid">
        {nodes.map(node => (
          <div
            key={node.id}
            className={`glass-palette-item ${interactive ? 'nav-interactive' : ''}`}
            onClick={() => {
              if (interactive && onAddNode) onAddNode(node.id);
            }}
            onDragStart={event => {
              if (!interactive) return;
              event.dataTransfer.setData('application/reactflow', node.id);
              event.dataTransfer.effectAllowed = 'move';
            }}
            draggable={interactive}
          >
            <div className="glass-item-icon">
              {getIconComponent(node.icon)}
            </div>
            <div className="glass-item-info">
              <span className="glass-item-name">{node.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

