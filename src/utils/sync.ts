import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { db } from '../db';

let provider: WebrtcProvider | null = null;
let wsProvider: any = null;
let wsCleanup: (() => void) | null = null;
let ydoc: Y.Doc | null = null;
let unobserved: (() => void) | null = null;

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

export const startSync = async (roomName: string, serverUrl?: string, password?: string) => {
  stopSync();

  ydoc = new Y.Doc();

  if (serverUrl && serverUrl.trim()) {
    wsProvider = createWsProvider(serverUrl, roomName, ydoc);
    wsCleanup = () => {
      if (wsProvider) {
        wsProvider.destroy();
        wsProvider = null;
      }
    };
  } else {
    provider = new WebrtcProvider(roomName, ydoc, {
      password: password || undefined,
    });
  }

  const yNotes = ydoc.getMap('notes');
  const yLinks = ydoc.getMap('links');

  const handleRemoteChange = (event: Y.YMapEvent<unknown>) => {
    for (const key of event.keysChanged) {
      const dataStr = yNotes.get(key) as string | undefined;
      if (dataStr) {
        try {
          const parsed = JSON.parse(dataStr);
          db.notes.get(parsed.id).then((existing) => {
            if (!existing || (parsed.updatedAt && existing.updatedAt && parsed.updatedAt > existing.updatedAt)) {
              db.notes.put(parsed);
            }
          });
        } catch (e) {
          console.error('Sync parse error', e);
        }
      }
    }
  };

  const handleLinksChange = (event: Y.YMapEvent<unknown>) => {
    for (const key of event.keysChanged) {
      const dataStr = yLinks.get(key) as string | undefined;
      if (dataStr) {
        try {
          const parsed = JSON.parse(dataStr);
          db.links.get(parsed.id).then((existing) => {
            if (!existing) {
              db.links.put(parsed);
            }
          });
        } catch (e) {
          console.error('Sync links parse error', e);
        }
      }
    }
  };

  yNotes.observe(handleRemoteChange);
  yLinks.observe(handleLinksChange);
  unobserved = () => {
    yNotes.unobserve(handleRemoteChange);
    yLinks.unobserve(handleLinksChange);
  };

  const broadcastLocalNote = (note: any) => {
    if (yNotes && note.id) {
      yNotes.set(note.id.toString(), JSON.stringify(note));
    }
  };

  const broadcastLocalLink = (link: any) => {
    if (yLinks && link.id) {
      yLinks.set(link.id.toString(), JSON.stringify(link));
    }
  };

  return { provider: provider || wsProvider, broadcastLocalNote, broadcastLocalLink };
};

export const stopSync = () => {
  if (unobserved) {
    unobserved();
    unobserved = null;
  }
  if (provider) {
    provider.destroy();
    provider = null;
  }
  if (wsCleanup) {
    wsCleanup();
    wsCleanup = null;
  }
  wsProvider = null;
  ydoc = null;
};
