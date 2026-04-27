/**
 * Sidebar component - Professional Navigation with Lucide Icons
 */

import React from 'react';
import { Moon, Sun, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Zap } from '../../components/icons';

interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}

interface SidebarProps {
  items: SidebarItem[];
  isOpen?: boolean;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  onClose?: () => void;
  onToggleSidebar?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  isOpen = true,
  isDarkMode = false,
  onToggleTheme,
  onToggleSidebar,
}) => {
  return (
    <aside className={`app-sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-top">
        <div className="sidebar-brand-row">
          <button
            className={`sidebar-logo-trigger ${isOpen ? 'open' : 'closed'}`}
            onClick={!isOpen ? onToggleSidebar : undefined}
            title={isOpen ? 'Automation Vibe' : 'Hover to uncollapse'}
            aria-label={isOpen ? 'Automation Vibe' : 'Expand sidebar'}
            type="button"
          >
            <span className="sidebar-logo-icon" aria-hidden="true">
              <Zap size={16} strokeWidth={2.4} />
            </span>
            <span className="sidebar-uncollapse-icon" aria-hidden="true">
              <PanelLeftOpen size={18} strokeWidth={2.2} />
            </span>
          </button>

          {isOpen && <span className="sidebar-brand-title">Automation Vibe</span>}

          {isOpen && onToggleSidebar && (
            <button
              className="sidebar-collapse-btn"
              onClick={onToggleSidebar}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
              type="button"
            >
              <PanelLeftClose size={18} strokeWidth={2.2} />
            </button>
          )}
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map(item => (
          <button
            key={item.id}
            className={`sidebar-item ${item.active ? 'active' : ''}`}
            onClick={item.onClick}
            title={item.label}
          >
            {item.icon && <span className="sidebar-icon">{item.icon}</span>}
            <span className="sidebar-item-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className="sidebar-theme-toggle"
          onClick={onToggleTheme}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="theme-toggle-icon">
            {isDarkMode ? <Moon size={16} strokeWidth={2.2} /> : <Sun size={16} strokeWidth={2.2} />}
          </span>
          <span className="sidebar-item-label">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
          <span className={`theme-toggle-switch ${isDarkMode ? 'active' : ''}`}>
            <span className="theme-toggle-knob" />
          </span>
        </button>
      </div>
    </aside>
  );
};
