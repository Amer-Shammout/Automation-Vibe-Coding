/**
 * AutomationList.tsx - Lists all automations with professional UI
 */

import React from 'react';
import { IAutomation } from '../models/types';
import { Button } from '../../../components/common';
import { Plus, Edit2, Play, Trash2 } from '../../../components/icons';

interface AutomationListProps {
  automations: IAutomation[];
  selectedId?: string;
  onSelect?: (automation: IAutomation) => void;
  onEdit: (automation: IAutomation) => void;
  onDelete: (id: string) => void;
  onExecute: (id: string) => void;
}

export const AutomationList: React.FC<AutomationListProps> = ({
  automations,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onExecute,
}) => {
  const handleEdit = (e: React.MouseEvent<HTMLButtonElement>, automation: IAutomation) => {
    e.stopPropagation();
    onEdit(automation);
  };

  const handleExecute = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.stopPropagation();
    onExecute(id);
  };

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.stopPropagation();
    onDelete(id);
  };

  return (
    <div className="automation-list">
      <div className="automation-list-header">
        <div>
          <h2>⚡ My Automations</h2>
        </div>
        <Button variant="primary">
          <Plus size={18} strokeWidth={2} /> New Automation
        </Button>
      </div>
      <div className="automation-list-items">
        {automations.length === 0 ? (
          <div className="empty-state">
            <p>🚀 No automations yet. Create your first one!</p>
          </div>
        ) : (
          automations.map(automation => (
            <div
              key={automation.id}
              className={`automation-item ${selectedId === automation.id ? 'selected' : ''}`}
              onClick={() => onSelect?.(automation)}
            >
              <div className="automation-item-content">
                <h3>{automation.name}</h3>
                <p>{automation.description || 'No description'}</p>
              </div>
              <div className="automation-item-actions">
                <Button
                  size="small"
                  variant="secondary"
                  onClick={e => handleEdit(e as React.MouseEvent<HTMLButtonElement>, automation)}
                  title="Edit automation"
                >
                  <Edit2 size={16} strokeWidth={2} />
                </Button>
                <Button
                  size="small"
                  variant="primary"
                  onClick={e => handleExecute(e as React.MouseEvent<HTMLButtonElement>, automation.id)}
                  title="Execute automation"
                >
                  <Play size={16} strokeWidth={2} />
                </Button>
                <Button
                  size="small"
                  variant="danger"
                  onClick={e => handleDelete(e as React.MouseEvent<HTMLButtonElement>, automation.id)}
                  title="Delete automation"
                >
                  <Trash2 size={16} strokeWidth={2} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
