import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export class SyncManager {
  private doc: Y.Doc;
  private provider: WebsocketProvider | null = null;
  private roomName: string;
  private serverUrl: string;

  constructor(roomName: string = 'pkg-room', serverUrl?: string) {
    this.doc = new Y.Doc();
    this.roomName = roomName;
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.serverUrl = serverUrl || `${protocol}//${host}:4234`;
  }

  public connect(): void {
    if (!this.provider) {
      this.provider = new WebsocketProvider(this.serverUrl, this.roomName, this.doc);
      this.provider.on('status', (event: any) => {
        // Status event tracking
        console.log('Sync status:', event.status);
      });
    }
  }

  public disconnect(): void {
    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
    }
  }

  public getDoc(): Y.Doc {
    return this.doc;
  }
}

export const syncManager = new SyncManager();
