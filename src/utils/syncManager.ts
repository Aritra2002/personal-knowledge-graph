import * as Y from 'yjs';

function createWsProvider(url: string, room: string, doc: Y.Doc) {
  const wsUrl = `${url.replace(/\/$/, '')}/${encodeURIComponent(room)}`;
  let ws: WebSocket | null = new WebSocket(wsUrl);
  let closed = false;
  const listeners: Array<(event: { status: string }) => void> = [];

  const emit = (status: string) => listeners.forEach(fn => fn({ status }));

  ws.binaryType = 'arraybuffer';

  ws.onopen = () => {
    emit('connected');
    const encoder = Y.encodeStateAsUpdate(doc);
    ws?.send(encoder as any);
  };

  ws.onmessage = (event: MessageEvent) => {
    if (event.data instanceof ArrayBuffer) {
      try {
        Y.applyUpdate(doc, new Uint8Array(event.data));
        emit('synced');
      } catch (e) {
        console.error('Failed to apply sync update:', e);
      }
    }
  };

  ws.onerror = () => emit('error');

  ws.onclose = () => {
    emit('disconnected');
    if (!closed) {
      setTimeout(() => {
        if (!closed) {
          ws = new WebSocket(wsUrl);
          ws.binaryType = 'arraybuffer';
          ws.onopen = () => {
            emit('connected');
            const encoder = Y.encodeStateAsUpdate(doc);
            ws?.send(encoder as any);
          };
          ws.onmessage = (event: MessageEvent) => {
            if (event.data instanceof ArrayBuffer) {
              try {
                Y.applyUpdate(doc, new Uint8Array(event.data));
                emit('synced');
              } catch (e) {
                console.error('Failed to apply sync update:', e);
              }
            }
          };
          ws.onclose = () => emit('disconnected');
        }
      }, 3000);
    }
  };

  const updateHandler = (update: Uint8Array, _origin: any) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(update as any);
    }
  };
  doc.on('update', updateHandler);

  return {
    on: (_event: string, fn: (event: { status: string }) => void) => {
      listeners.push(fn);
    },
    destroy: () => {
      closed = true;
      doc.off('update', updateHandler);
      if (ws) {
        ws.onclose = null;
        ws.close();
        ws = null;
      }
    },
  };
}

export class SyncManager {
  private doc: Y.Doc;
  private provider: any = null;
  private roomName: string;
  private serverUrl: string;

  constructor(roomName: string = 'pkg-room', serverUrl: string = 'ws://localhost:1234') {
    this.doc = new Y.Doc();
    this.roomName = roomName;
    this.serverUrl = serverUrl;
  }

  public connect(): void {
    if (!this.provider) {
      this.provider = createWsProvider(this.serverUrl, this.roomName, this.doc);
      this.provider.on('status', () => {
        // Status event tracking disabled for production
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
