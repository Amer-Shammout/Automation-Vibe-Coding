/**
 * MainLayout - Main application layout component
 */

import React from 'react';

interface MainLayoutProps {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  sidebarCollapsed?: boolean;
  main: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ header, sidebar, sidebarCollapsed = false, main }) => {
  return (
    <div className="main-layout">
      {/* Decorative Orbs for Glassmorphism UI */}
      <div className="bg-orb bg-orb-1"></div>
      <div className="bg-orb bg-orb-2"></div>
      <div className="bg-orb bg-orb-3"></div>
      
      {header && <header className="layout-header">{header}</header>}
      <div className="layout-content">
        {sidebar && <aside className={`layout-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>{sidebar}</aside>}
        <main className="layout-main">{main}</main>
      </div>
    </div>
  );
};
