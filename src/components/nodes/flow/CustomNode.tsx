import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Trash2 } from '../../../components/icons';
import { INodeData } from './types';
import './CustomNode.css';

export const CustomNode: React.FC<NodeProps<INodeData>> = ({ data, selected }) => {
  const normalizedType = String(data.type || '').toLowerCase();
  const colorValue = typeof data.config?.color === 'string' ? data.config.color : '#22c55e';
  const messageValue = typeof data.config?.message === 'string' ? data.config.message : '';
  const inputCount = data.inputs.length;
  const outputCount = data.outputs.length;

  const previewText =
    normalizedType === 'color'
      ? `Accent ${colorValue}`
      : normalizedType === 'log'
        ? messageValue || 'Log message ready'
        : `${inputCount} inputs · ${outputCount} outputs`;

  const typeMeta =
    normalizedType === 'color'
      ? { icon: 'C', badge: 'Color' }
      : normalizedType === 'log'
        ? { icon: 'L', badge: 'Log' }
        : { icon: 'N', badge: data.type };

  return (
    <div className={`custom-node ${selected ? 'selected' : ''} node-type-${normalizedType}`}>
      <div className="node-accent" />

      <div className="node-header">
        <div className="node-title-wrap">
          <span className="node-icon">{typeMeta.icon}</span>
          <div className="node-title-stack">
            <h3 className="node-title">{data.label}</h3>
            <p className="node-subtitle">{previewText}</p>
          </div>
        </div>
        <span className="node-type">{typeMeta.badge}</span>
      </div>

      <div className="node-meta-row">
        <span className="node-meta-chip">{inputCount} inputs</span>
        <span className="node-meta-chip">{outputCount} outputs</span>
        <span className="node-meta-chip node-meta-chip-muted">Drag to connect</span>
      </div>

      {normalizedType === 'color' && (
        <div className="node-control-row">
          <label htmlFor={`node-color-${data.label}`} className="node-control-label">
            Color
          </label>
          <div className="node-color-group">
            <input
              id={`node-color-${data.label}`}
              type="color"
              value={colorValue}
              className="node-color-input"
              onChange={event => data.onUpdateConfig?.({ color: event.target.value })}
              onClick={event => event.stopPropagation()}
            />
            <span className="node-color-value">{colorValue}</span>
          </div>
        </div>
      )}

      {normalizedType === 'log' && (
        <div className="node-control-row">
          <label htmlFor={`node-message-${data.label}`} className="node-control-label">
            Message
          </label>
          <input
            id={`node-message-${data.label}`}
            type="text"
            value={messageValue}
            placeholder="Write log message"
            className="node-text-input"
            onChange={event => data.onUpdateConfig?.({ message: event.target.value })}
            onClick={event => event.stopPropagation()}
          />
        </div>
      )}

      <div className="node-port-section">
        <div className="node-port-section-title">Ports</div>

        <div className="node-inputs">
          {data.inputs.map(port => (
            <div key={port.id} className="port-item input">
              <Handle type="target" position={Position.Left} id={`input-${port.id}`} className="port-handle" />
              <span className="port-label">{port.id}</span>
            </div>
          ))}
        </div>

        <div className="node-outputs">
          {data.outputs.map(port => (
            <div key={port.id} className="port-item output">
              <span className="port-label">{port.id}</span>
              <Handle type="source" position={Position.Right} id={`output-${port.id}`} className="port-handle" />
            </div>
          ))}
        </div>
      </div>

      <button
        className="node-delete"
        title="Delete node"
        onClick={event => {
          event.stopPropagation();
          data.onDelete?.();
        }}
      >
        <Trash2 size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
};
