/**
 * Sidebar component - Professional Navigation with Lucide Icons
 */

import React from 'react';
import { X, Moon, Sun } from 'lucide-react';

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
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  isOpen = true,
  isDarkMode = false,
  onToggleTheme,
  onClose,
}) => {
  return (
    <aside className={`app-sidebar ${isOpen ? 'open' : 'closed'}`}>
      {onClose && (
        <div className="sidebar-top">
          <button className="sidebar-close" onClick={onClose} title="Close sidebar">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
      )}

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
