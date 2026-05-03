import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Trash2, Play, Palette, FileText } from '../../../components/icons';
import { INodeData } from './types';
import './CustomNode.css';

export const CustomNode: React.FC<NodeProps<INodeData>> = ({ data, selected }) => {
  const normalizedType = String(data.type || '').toLowerCase();
  const colorValue = typeof data.config?.color === 'string' ? data.config.color : '#00d2ff';
  const messageValue = typeof data.config?.message === 'string' ? data.config.message : '';
  const startTextValue = typeof data.config?.text === 'string' ? data.config.text : '';

  return (
    <div className={`glass-node glass-type-${normalizedType} ${selected ? 'glass-selected' : ''}`}>
      <div className="glass-glow" />
      <div className="glass-inner">
        <div className="glass-header">
          <div className="glass-icon-box">
            {normalizedType === 'color' ? <Palette size={18} strokeWidth={2} /> : normalizedType === 'log' ? <FileText size={18} strokeWidth={2} /> : normalizedType === 'start' ? <Play size={18} strokeWidth={2} /> : <Palette size={18} strokeWidth={2} />}
          </div>
          <div className="glass-title-area">
            <h3 className="glass-title">{data.label}</h3>
            <span className="glass-subtitle">{data.type}</span>
          </div>
          {normalizedType !== 'start' && (
            <button className="glass-delete-btn" onClick={(e) => { e.stopPropagation(); data.onDelete?.(); }}>
              <Trash2 size={16} strokeWidth={2} />
            </button>
          )}
        </div>

        <div className="glass-body">
          {normalizedType === 'color' && (
            <div className="glass-input-group glass-color-group">
              <label>Hex Color</label>
              <div className="glass-color-picker-wrap">
                <input
                  type="color"
                  value={colorValue}
                  onChange={e => data.onUpdateConfig?.({ color: e.target.value })}
                  onClick={e => e.stopPropagation()}
                />
                <span>{colorValue}</span>
              </div>
            </div>
          )}

          {normalizedType === 'start' && (
            <div className="glass-input-group">
              <label>Start Text</label>
              <input
                type="text"
                placeholder="Enter the automation text..."
                value={startTextValue}
                onChange={e => data.onUpdateConfig?.({ text: e.target.value })}
                onClick={e => e.stopPropagation()}
                className="glass-text-input"
              />
            </div>
          )}

          {normalizedType === 'log' && (
            <div className="glass-input-group">
              <label>Log Message</label>
              <input
                type="text"
                placeholder="Enter log text..."
                value={messageValue}
                onChange={e => data.onUpdateConfig?.({ message: e.target.value })}
                onClick={e => e.stopPropagation()}
                className="glass-text-input"
              />
            </div>
          )}
        </div>

        <div className="glass-ports">
          <div className="glass-ports-col glass-ports-in">
            {data.inputs.map(port => (
              <div key={port.id} className="glass-port-wrapper">
                <Handle type="target" position={Position.Left} id={`input-${port.id}`} className="glass-handle" />
                <span className="glass-port-label">{port.id}</span>
              </div>
            ))}
          </div>
          <div className="glass-ports-col glass-ports-out">
            {data.outputs.map(port => (
              <div key={port.id} className="glass-port-wrapper">
                <span className="glass-port-label">{port.id}</span>
                <Handle type="source" position={Position.Right} id={`output-${port.id}`} className="glass-handle" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
