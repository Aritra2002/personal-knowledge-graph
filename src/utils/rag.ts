import { db, type DocumentChunk } from '../db';
import { generateEmbedding, cosineSimilarity } from './vectorSearch';

// Chunk text into overlapping segments
export const chunkText = (text: string, chunkSize: number = 1000, overlap: number = 200): string[] => {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;
    if (end >= text.length) {
      chunks.push(text.slice(start).trim());
      break;
    }

    const searchArea = text.slice(Math.max(start, end - 300), end);
    let breakIdx = searchArea.lastIndexOf('\n\n');
    if (breakIdx === -1) breakIdx = searchArea.lastIndexOf('\n');
    if (breakIdx === -1) breakIdx = searchArea.lastIndexOf('. ');
    if (breakIdx === -1) breakIdx = searchArea.lastIndexOf(' ');

    if (breakIdx !== -1) {
      end = Math.max(start, end - 300) + breakIdx + 1;
    }

    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    start = end - overlap;
  }

  return chunks;
};

// Generate a unique document ID
const generateDocId = (): string => `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

// Ingest a document into the RAG store
export const ingestDocument = async (
  name: string,
  content: string,
  metadata: Record<string, unknown> = {},
  onProgress?: (msg: string) => void
): Promise<{ documentId: string; chunkCount: number }> => {
  const documentId = generateDocId();
  const chunks = chunkText(content);

  if (onProgress) onProgress(`Embedding ${chunks.length} chunks...`);

  const chunkDocs: Omit<DocumentChunk, 'id'>[] = [];

  for (let i = 0; i < chunks.length; i++) {
    if (onProgress) onProgress(`Embedding chunk ${i + 1}/${chunks.length}...`);
    const embedding = await generateEmbedding(chunks[i]);
    chunkDocs.push({
      documentId,
      documentName: name,
      chunkIndex: i,
      content: chunks[i],
      embedding,
      metadata: { ...metadata, totalChunks: chunks.length },
      createdAt: Date.now(),
    });
  }

  await db.documents.bulkAdd(chunkDocs as DocumentChunk[]);

  if (onProgress) onProgress(`Ingested ${chunks.length} chunks from "${name}"`);
  return { documentId, chunkCount: chunks.length };
};

// Ingest a note into RAG (for unified search)
export const ingestNote = async (noteId: number, title: string, content: string): Promise<void> => {
  if (!content.trim()) return;

  const text = `${title}\n\n${content}`;
  const chunks = chunkText(text, 800, 150);

  const chunkDocs: Omit<DocumentChunk, 'id'>[] = [];

  // Embed all chunks first before touching the DB
  for (let i = 0; i < chunks.length; i++) {
    const embedding = await generateEmbedding(chunks[i]);
    chunkDocs.push({
      documentId: `note_${noteId}`,
      documentName: `[Note] ${title}`,
      chunkIndex: i,
      content: chunks[i],
      embedding,
      metadata: { type: 'note', noteId },
      createdAt: Date.now(),
    });
  }

  // Atomically replace old chunks with new ones
  await db.transaction('rw', db.documents, async () => {
    await db.documents.where('documentId').equals(`note_${noteId}`).delete();
    await db.documents.bulkAdd(chunkDocs as DocumentChunk[]);
  });
};

// Remove a note from RAG
export const removeNoteFromRag = async (noteId: number): Promise<void> => {
  await db.documents.where('documentId').equals(`note_${noteId}`).delete();
};

// Search documents by semantic similarity
export const searchDocuments = async (
  query: string,
  limit: number = 5
): Promise<Array<DocumentChunk & { score: number }>> => {
  const queryEmbedding = await generateEmbedding(query);
  const chunks = await db.documents.toArray();

  return chunks
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

// Get all unique documents
export const listDocuments = async (): Promise<{ documentId: string; documentName: string; chunkCount: number; createdAt: number }[]> => {
  const chunks = await db.documents.toArray();
  const docMap = new Map<string, { documentId: string; documentName: string; chunkCount: number; createdAt: number }>();

  for (const chunk of chunks) {
    const existing = docMap.get(chunk.documentId);
    if (existing) {
      existing.chunkCount++;
    } else {
      docMap.set(chunk.documentId, {
        documentId: chunk.documentId,
        documentName: chunk.documentName,
        chunkCount: 1,
        createdAt: chunk.createdAt,
      });
    }
  }

  return Array.from(docMap.values()).sort((a, b) => b.createdAt - a.createdAt);
};

// Delete a document and all its chunks
export const deleteDocument = async (documentId: string): Promise<number> => {
  return await db.documents.where('documentId').equals(documentId).delete();
};

// Build RAG context from search results
export const buildRagContext = (results: Array<DocumentChunk & { score: number }>): string => {
  if (results.length === 0) return '';

  return results
    .map((r, i) => `[Source ${i + 1}: "${r.documentName}" (score: ${r.score.toFixed(3)})]\n${r.content}`)
    .join('\n\n---\n\n');
};
