/**
 * Header component - Professional Design with Lucide Icons
 */

import React from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Zap } from '../../components/icons';

interface HeaderProps {
  title?: string;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, sidebarCollapsed = false, onSidebarToggle, actions }) => {
  return (
    <header className="app-header">
      <div className="header-left">
        {onSidebarToggle && (
          <button
            className="header-sidebar-toggle"
            onClick={onSidebarToggle}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen size={18} strokeWidth={2.2} />
            ) : (
              <PanelLeftClose size={18} strokeWidth={2.2} />
            )}
          </button>
        )}

        <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
          <div className="app-logo-wrap" aria-hidden="true">
            <Zap size={16} strokeWidth={2.4} />
          </div>

          {title && <h1>{title}</h1>}
        </div>
      </div>
      {actions && <div className="header-actions">{actions}</div>}
    </header>
  );
};
