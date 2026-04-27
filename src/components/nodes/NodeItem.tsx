/**
 * NodeItem - Individual node representation
 */

import React from 'react';
import { Trash2, MoveRight } from 'lucide-react';
import { INode } from '../../features/automation/models/types';

interface NodeItemProps {
  node: INode;
  isSelected?: boolean;
  onSelect?: (node: INode) => void;
  onDelete?: (nodeId: string) => void;
}

export const NodeItem: React.FC<NodeItemProps> = ({ node, isSelected, onSelect, onDelete }) => {
  const inputCount = node.inputs?.length ?? 0;
  const outputCount = node.outputs?.length ?? 0;

  return (
    <div className={`node-item ${isSelected ? 'selected' : ''}`} onClick={() => onSelect?.(node)}>
      <div className="node-item-accent" />

      <div className="node-item-header">
        <div className="node-item-title-wrap">
          <div className="node-item-badge">{node.name.slice(0, 1).toUpperCase()}</div>
          <div>
            <h4>{node.name}</h4>
            <p className="node-item-subtitle">Reusable workflow node</p>
          </div>
        </div>
        {onDelete && (
          <button
            className="node-item-delete"
            onClick={e => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            title="Delete node"
          >
            <Trash2 size={14} strokeWidth={2.4} />
          </button>
        )}
      </div>

      <div className="node-item-meta">
        <span className="node-item-chip">{node.type}</span>
        <span className="node-item-chip node-item-chip-soft">{inputCount} inputs</span>
        <span className="node-item-chip node-item-chip-soft">{outputCount} outputs</span>
      </div>

      <div className="node-item-ports">
        <div className="ports-inputs">
          {node.inputs.map((port: any) => (
            <div key={port.id} className="port port-input">
              <span className="port-dot port-dot-input" />
              <span>{port.name}</span>
            </div>
          ))}
        </div>
        <div className="ports-outputs">
          {node.outputs.map((port: any) => (
            <div key={port.id} className="port port-output">
              <span>{port.name}</span>
              <MoveRight size={12} strokeWidth={2.2} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
