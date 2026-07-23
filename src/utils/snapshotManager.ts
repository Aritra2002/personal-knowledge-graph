import { db, type Note, type Link, type GraphSnapshot } from '../db';

export const saveSnapshot = async (pageId: number): Promise<number> => {
  const notes = await db.notes.where({ pageId }).toArray();
  const allLinks = await db.links.toArray();
  const currentNoteIds = new Set(notes.map(n => n.id!));
  const links = allLinks.filter(l => currentNoteIds.has(l.sourceId) && currentNoteIds.has(l.targetId));

  const id = await db.snapshots.add({
    timestamp: Date.now(),
    pageId,
    notesData: JSON.stringify(notes),
    linksData: JSON.stringify(links),
  });

  return id as number;
};

export const getSnapshots = async (pageId: number): Promise<GraphSnapshot[]> => {
  const snapshots = await db.snapshots
    .where({ pageId })
    .sortBy('timestamp');
  return snapshots.reverse();
};

export const loadSnapshot = async (snapshotId: number): Promise<{ notes: Note[]; links: Link[]; timestamp: number } | null> => {
  const snapshot = await db.snapshots.get(snapshotId);
  if (!snapshot) return null;

  return {
    notes: JSON.parse(snapshot.notesData),
    links: JSON.parse(snapshot.linksData),
    timestamp: snapshot.timestamp,
  };
};

export const restoreSnapshot = async (snapshotId: number, pageId: number): Promise<void> => {
  const data = await loadSnapshot(snapshotId);
  if (!data) throw new Error('Snapshot not found');

  await db.transaction('rw', [db.notes, db.links], async () => {
    const remainingNoteIds = (await db.notes.where({ pageId }).toArray()).map(n => n.id!);
    const allLinks = await db.links.toArray();
    const linksToDelete = allLinks.filter(l => remainingNoteIds.includes(l.sourceId) || remainingNoteIds.includes(l.targetId));
    await db.notes.where({ pageId }).delete();
    await db.links.bulkDelete(linksToDelete.map(l => l.id!));

    const idMap = new Map<number, number>();
    for (const note of data.notes) {
      const oldId = note.id!;
      const noteData = { ...note, pageId };
      delete (noteData as Record<string, unknown>).id;
      const newId = await db.notes.add(noteData);
      idMap.set(oldId, newId as number);
    }
    for (const link of data.links) {
      const newSourceId = idMap.get(link.sourceId);
      const newTargetId = idMap.get(link.targetId);
      if (!newSourceId || !newTargetId) continue;
      await db.links.add({
        sourceId: newSourceId,
        targetId: newTargetId,
      });
    }
  });
};

export const deleteSnapshot = async (snapshotId: number): Promise<void> => {
  await db.snapshots.delete(snapshotId);
};
