/**
 * Header component - Professional Design with Lucide Icons
 */

import React from 'react';
import { Zap } from '../../components/icons';

interface HeaderProps {
  title?: string;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, actions }) => {
  return (
    <header className="app-header">
      <div className="header-left">
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
