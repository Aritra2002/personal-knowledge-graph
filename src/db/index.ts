import Dexie, { type Table } from 'dexie';

export interface Page {
  id?: number;
  title: string;
  createdAt: number;
}

export interface Note {
  id?: number;
  pageId: number;
  title: string;
  content: string;
  tags: string[];
  category: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
  linkedNoteIds?: number[];
  
  // Analytics & Flashcards
  visits?: number;
  nextReview?: number;
  interval?: number;
  ease?: number;
  
  // Canvas / Whiteboard
  isExcalidraw?: boolean;
  excalidrawElements?: unknown;
  
  // Semantic Search
  embedding?: number[];
}

export interface Link {
  id?: number;
  sourceId: number;
  targetId: number;
  explanation?: string;
}

export interface Category {
  id: string; // Used as the category identifier (e.g., 'work', 'general')
  label: string; // Display name
  color: string; // Hex color code
}

export interface GraphSnapshot {
  id?: number;
  timestamp: number;
  pageId: number;
  notesData: string; // Serialized notes
  linksData: string; // Serialized links
}

export class AetherMindDB extends Dexie {
  pages!: Table<Page, number>;
  notes!: Table<Note, number>;
  links!: Table<Link, number>;
  categories!: Table<Category, string>;
  snapshots!: Table<GraphSnapshot, number>;

  constructor() {
    super('aether_mind_db');

    this.version(1).stores({
      notes: '++id, &title, *tags, category, createdAt, updatedAt',
      links: '++id, sourceId, targetId, [sourceId+targetId]'
    });
    this.version(2).stores({
      categories: 'id, label, color'
    });
    this.version(3).stores({
      notes: '++id, &title, *tags, category, createdAt, updatedAt, nextReview'
    });

    // Version 4: Added Pages table and pageId to notes
    this.version(4).stores({
      pages: '++id, title',
      notes: '++id, pageId, title, *tags, category, createdAt, updatedAt, nextReview'
    }).upgrade(async tx => {
      // 1. Create a default "Graph" page
      const defaultPageId = await tx.table('pages').add({
        title: 'Graph',
        createdAt: Date.now()
      });

      // 2. Assign all existing notes to this default page
      await tx.table('notes').toCollection().modify(note => {
        note.pageId = defaultPageId;
      });
    });

    // Version 5: Graph Snapshots
    this.version(5).stores({
      snapshots: '++id, timestamp, pageId'
    });

    // Version 6: Link Explanations
    this.version(6).stores({
      links: '++id, sourceId, targetId, [sourceId+targetId], explanation'
    });
  }
}

export const db = new AetherMindDB();
