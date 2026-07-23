import React from 'react';
import { Network, FileText, Plus, Menu, Search } from 'lucide-react';

interface MobileNavProps {
  activeTab: 'graph' | 'editor' | 'search' | 'menu';
  onTabChange: (tab: 'graph' | 'editor' | 'search' | 'menu') => void;
  onNewPage: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange, onNewPage }) => {
  return (
    <nav className="navbar fixed-bottom d-flex d-md-none justify-content-around align-items-center px-2"
      style={{
        height: 'calc(var(--mobile-nav-height, 60px) + var(--safe-bottom, env(safe-area-inset-bottom, 0px)))',
        background: 'var(--surface-glass-heavy)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(124, 58, 237, 0.15)',
        paddingBottom: 'var(--safe-bottom, env(safe-area-inset-bottom, 0px))',
        zIndex: 100
      }}>
      {[
        { tab: 'graph' as const, icon: <Network size={20} />, label: 'Graph' },
        { tab: 'search' as const, icon: <Search size={20} />, label: 'Search' },
        { tab: 'editor' as const, icon: <FileText size={20} />, label: 'Editor' },
      ].map(({ tab, icon, label }) => (
        <button
          key={tab}
          className="nav-link d-flex flex-column align-items-center gap-1 border-0 bg-transparent"
          style={{ color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-secondary)', padding: '4px', width: '60px', outline: 'none' }}
          onClick={() => onTabChange(tab)}
        >
          <span style={{ transform: activeTab === tab ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s' }}>{icon}</span>
          <span style={{ fontSize: '10px' }}>{label}</span>
        </button>
      ))}
      <button
        className="nav-link d-flex flex-column align-items-center gap-1 border-0 bg-transparent"
        style={{ color: 'var(--text-secondary)', padding: '4px', width: '60px', outline: 'none' }}
        onClick={onNewPage}
      >
        <Plus size={20} />
        <span style={{ fontSize: '10px' }}>New Page</span>
      </button>
      <button
        className="nav-link d-flex flex-column align-items-center gap-1 border-0 bg-transparent"
        style={{ color: activeTab === 'menu' ? 'var(--accent-primary)' : 'var(--text-secondary)', padding: '4px', width: '60px', outline: 'none' }}
        onClick={() => onTabChange('menu')}
      >
        <span style={{ transform: activeTab === 'menu' ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s' }}><Menu size={20} /></span>
        <span style={{ fontSize: '10px' }}>Menu</span>
      </button>
    </nav>
  );
};