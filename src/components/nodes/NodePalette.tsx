/**
 * NodePalette - Palette for available nodes
 */

import React, { useState } from 'react';

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

export const NodePalette: React.FC<NodePaletteProps> = ({ nodes, interactive = false, onAddNode }) => {
  const categories = Array.from(new Set(nodes.map(n => n.category)));
  const [expandedCategory, setExpandedCategory] = useState<string | null>(categories[0] ?? null);

  React.useEffect(() => {
    if (categories.length === 0) {
      setExpandedCategory(null);
      return;
    }

    if (!expandedCategory || !categories.includes(expandedCategory)) {
      setExpandedCategory(categories[0]);
    }
  }, [categories, expandedCategory]);

  return (
    <div className="node-palette">
      <div className="palette-header">
        <h3>Node Library</h3>
      </div>
      <div className="palette-content">
        {categories.map(category => (
          <div key={category} className="palette-category">
            <button
              className="category-header"
              onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
            >
              <span className="category-name">{category}</span>
              <span className="category-arrow">{expandedCategory === category ? '▼' : '▶'}</span>
            </button>
            {expandedCategory === category && (
              <div className="category-nodes">
                {nodes
                  .filter(n => n.category === category)
                  .map(node => (
                    <article
                      key={node.id}
                      className={`palette-node ${interactive ? 'interactive' : ''}`}
                      aria-label={node.name}
                      onClick={() => {
                        if (interactive) {
                          onAddNode?.(node.id);
                        }
                      }}
                      onDragStart={event => {
                        if (!interactive) {
                          return;
                        }

                        event.dataTransfer.setData('application/reactflow', node.id);
                        event.dataTransfer.effectAllowed = 'move';
                      }}
                      draggable={interactive}
                    >
                      <span className="palette-node-accent" />
                      <div className="palette-node-head">
                        {node.icon && <span className="node-icon">{node.icon}</span>}
                        <div className="palette-node-text">
                          <span className="palette-node-title">{node.name}</span>
                          <span className="palette-node-desc">
                            {interactive
                              ? 'Drag to canvas or click to add'
                              : 'Information card for available node type'}
                          </span>
                        </div>
                      </div>
                      <div className="palette-node-footer">
                        <span className="palette-node-chip">{node.type ?? category}</span>
                        <span className="palette-node-hint">{interactive ? 'Hold and drop' : 'Read only'}</span>
                      </div>
                    </article>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
