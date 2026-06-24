import React, { useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { startSync, stopSync } from '../../utils/sync';
import { useToast } from '../ToastContext';

export const SyncSettingsTab: React.FC = () => {
  const { showToast } = useToast();
  const [syncRoom, setSyncRoom] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncServerUrl, setSyncServerUrl] = useState(() => localStorage.getItem('aethermind-sync-server-url') || 'ws://localhost:1234');

  return (
    <div className="settings-section">
      <h3>Dedicated Sync Server (CRDT-based)</h3>
      <p className="section-desc">Sync your graph with other devices via a self-hosted y-websocket sync server.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
        <input
          type="text"
          placeholder="Sync Server URL (e.g. ws://localhost:1234)"
          value={syncServerUrl}
          onChange={(e) => {
            setSyncServerUrl(e.target.value);
            localStorage.setItem('aethermind-sync-server-url', e.target.value);
          }}
          disabled={isSyncing}
          style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '4px', color: '#fff', fontSize: '0.85rem' }}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Room Name (e.g. my-graph)"
            value={syncRoom}
            onChange={(e) => setSyncRoom(e.target.value)}
            disabled={isSyncing}
            style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '4px', color: '#fff', fontSize: '0.85rem' }}
          />
          <button 
            className={`primary-btn ${isSyncing ? 'danger-btn' : ''}`}
            onClick={() => {
              if (isSyncing) {
                stopSync();
                setIsSyncing(false);
              } else {
                if (!syncRoom.trim()) return showToast('Enter a room name', 'error');
                if (!syncServerUrl.trim()) return showToast('Enter a sync server URL', 'error');
                startSync(syncRoom, syncServerUrl);
                setIsSyncing(true);
              }
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
          >
            {isSyncing ? <WifiOff size={16} /> : <Wifi size={16} />}
            {isSyncing ? 'Stop Sync' : 'Start Sync'}
          </button>
        </div>
      </div>
      {isSyncing && <p className="section-desc" style={{ color: 'var(--node-emerald)', marginTop: '8px' }}>Syncing to "{syncRoom}" via {syncServerUrl}</p>}
    </div>
  );
};
