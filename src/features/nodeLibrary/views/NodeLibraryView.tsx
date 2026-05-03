import React from 'react';
import { Play, Palette, FileText, Zap } from '../../../components/icons';

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

const renderIcon = (iconName: string) => {
  switch (iconName) {
    case 'play': return <Play size={20} strokeWidth={2} />;
    case 'palette': return <Palette size={20} strokeWidth={2} />;
    case 'file-text': return <FileText size={20} strokeWidth={2} />;
    default: return <Zap size={20} strokeWidth={2} />;
  }
};

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
              <span className="node-library-icon">{renderIcon(template.icon)}</span>
              <div>
                <h3>{template.name}</h3>
                <span className="node-library-type">{template.type}</span>
              </div>
            </header>

            <p className="node-library-desc">{template.description}</p>

            <div className="node-library-meta">
              <span>Category: {template.category}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
