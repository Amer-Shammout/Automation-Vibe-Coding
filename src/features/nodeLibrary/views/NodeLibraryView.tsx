import React from 'react';

export interface INodeTemplateView {
  id: string;
  name: string;
  type: string;
  category: string;
  icon: string;
  inputsCount: number;
  outputsCount: number;
  description: string;
}

interface NodeLibraryViewProps {
  templates: INodeTemplateView[];
}

export const NodeLibraryView: React.FC<NodeLibraryViewProps> = ({ templates }) => {
  return (
    <div className="page-shell">
      <div className="page-head">
        <div>
          <h2>Node Library</h2>
          <p>Information catalog for all available node types in this platform.</p>
        </div>
      </div>

      <div className="node-library-grid">
        {templates.map(template => (
          <article key={template.id} className="node-library-card">
            <header className="node-library-card-head">
              <span className="node-library-icon">{template.icon}</span>
              <div>
                <h3>{template.name}</h3>
                <span className="node-library-type">{template.type}</span>
              </div>
            </header>

            <p className="node-library-desc">{template.description}</p>

            <div className="node-library-meta">
              <span>Category: {template.category}</span>
              <span>
                Ports: {template.inputsCount} in / {template.outputsCount} out
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
