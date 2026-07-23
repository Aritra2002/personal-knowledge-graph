import React, { useState } from 'react';
import { Database, Brain, Info, Calendar as CalendarIcon, Palette } from 'lucide-react';
import packageJson from '../../../package.json';
import { DataSettingsTab } from './DataSettingsTab';
import { AiSettingsTab } from './AiSettingsTab';
import { JournalCalendar } from '../JournalCalendar';
import { AppearanceSettingsTab } from './AppearanceSettingsTab';
import type { Category } from '../../db';

interface SettingsModalProps {
  onClose: () => void;
  onRefreshData: () => void;
  physicsConfig: { linkDistance: number; chargeStrength: number };
  onPhysicsChange: (config: { linkDistance: number; chargeStrength: number }) => void;
  categories: Category[];
  nlpClustering: boolean;
  onNlpClusteringChange: (val: boolean) => void;
  onSaveSnapshot?: () => void;
  onViewSnapshots?: () => void;
  activePageId: number;
  pageTitle?: string;
  activeTheme: string;
  onThemeSelect: (theme: string) => void;
  customThemeColors: Record<string, string>;
  onCustomThemeColorChange: (key: string, color: string) => void;
  onCustomThemeReset: () => void;
  onSelectNote?: (title: string) => void;
}

type TabType = 'data' | 'journal' | 'ai' | 'appearance' | 'about';

export const SettingsModal: React.FC<SettingsModalProps> = (props) => {
  const [activeTab, setActiveTab] = useState<TabType>('data');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="modal d-block" tabIndex={-1} style={{ zIndex: 1060 }} onClick={props.onClose}>
      <div className="modal-dialog modal-xl modal-dialog-centered" style={{ maxWidth: '1000px', height: '80vh' }} onClick={e => e.stopPropagation()}>
        <div className="modal-content glass-panel border-0 h-100 d-flex flex-column" style={{ overflow: 'hidden' }}>
          {/* Header */}
          <div className="modal-header border-0 d-flex justify-content-between align-items-center flex-shrink-0 px-3 py-2">
            {!isMobile && (
              <div>
                <h5 className="modal-title" style={{ fontSize: '1.2rem' }}>Settings</h5>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>v{packageJson.version}</div>
              </div>
            )}
            <button type="button" className="btn-close ms-auto" onClick={props.onClose} aria-label="Close" style={{ filter: 'invert(0.7)' }} />
          </div>

          {/* Body: tabs + content */}
          <div className="modal-body d-flex flex-grow-1 overflow-hidden p-0" style={{ flexDirection: isMobile ? 'column' : 'row' }}>
            {/* Tab sidebar */}
            <div className={isMobile ? 'd-flex overflow-auto flex-shrink-0 gap-1 p-2' : 'd-flex flex-column flex-shrink-0 p-3 gap-1'} 
                 style={{ width: isMobile ? '100%' : '220px', borderRight: isMobile ? 'none' : '1px solid var(--border-color)', borderBottom: isMobile ? '1px solid var(--border-color)' : 'none', background: 'rgba(0,0,0,0.2)' }}>
              {[
                { id: 'data' as TabType, label: 'Data & Graph', icon: <Database size={16} /> },
                { id: 'journal' as TabType, label: 'Journal', icon: <CalendarIcon size={16} /> },
                { id: 'ai' as TabType, label: 'AI Integration', icon: <Brain size={16} /> },
                { id: 'appearance' as TabType, label: 'Appearance', icon: <Palette size={16} /> },
                { id: 'about' as TabType, label: 'About', icon: <Info size={16} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`nav-link d-flex align-items-center gap-2 text-start px-3 py-2 rounded ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  style={{ whiteSpace: 'nowrap', border: 'none', background: activeTab === tab.id ? 'rgba(124, 58, 237, 0.15)' : 'transparent', color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)', width: isMobile ? 'auto' : '100%' }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-grow-1 overflow-auto p-3" style={{ scrollbarGutter: 'stable' }}>
              {activeTab === 'data' && (
                <DataSettingsTab 
                  onClose={props.onClose} 
                  onRefreshData={props.onRefreshData} 
                  physicsConfig={props.physicsConfig}
                  onPhysicsChange={props.onPhysicsChange}
                  categories={props.categories}
                  nlpClustering={props.nlpClustering}
                  onNlpClusteringChange={props.onNlpClusteringChange}
                  activePageId={props.activePageId}
                  pageTitle={props.pageTitle}
                  onSaveSnapshot={props.onSaveSnapshot}
                  onViewSnapshots={props.onViewSnapshots}
                />
              )}
              {activeTab === 'journal' && <JournalCalendar onSelectNote={props.onSelectNote} />}
              {activeTab === 'ai' && <AiSettingsTab />}
              {activeTab === 'appearance' && (
                <AppearanceSettingsTab
                  activeTheme={props.activeTheme}
                  onThemeSelect={props.onThemeSelect}
                  customThemeColors={props.customThemeColors}
                  onCustomThemeColorChange={props.onCustomThemeColorChange}
                  onCustomThemeReset={props.onCustomThemeReset}
                />
              )}
              {activeTab === 'about' && (
                <div className="settings-section about-section" style={{ marginTop: '40px' }}>
                  <div className="about-header">
                    <Info size={16} className="about-icon" />
                    <h3>About AetherMind</h3>
                  </div>
                  <p>
                    <strong>AetherMind v{packageJson.version} - Local-first personal knowledge graph</strong><br/>
                    is a dynamic visual space for your notes. By combining a 
                    D3 force-directed simulation and Markdown parsing, it transforms flat text notes into 
                    an organic, navigable web.
                  </p>
                  <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--accent-danger, #ef4444)' }}>
                    <strong>License: AGPL-3.0</strong><br />
                    This application is distributed under the GNU Affero General Public License v3.0. 
                    Any modifications or network use of this software must remain fully open-source.
                  </div>
                  <div className="credits">
                    Version {packageJson.version} (Local-First)
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};