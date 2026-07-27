/**
 * LessonContextService
 * ────────────────────
 * Lightweight in-memory Retrieval-Augmented Generation (RAG) service
 * for a single CBSE Grade 11 Accountancy lesson (Journal chapter).
 *
 * Architecture:
 *  1. On init: fetch lesson-chunks.json from /public, embed each chunk
 *     using OpenAI text-embedding-3-small, store in memory.
 *  2. On retrieve(query): embed the query, cosine-similarity rank chunks,
 *     return top-K most relevant text snippets.
 *  3. Designed to add more lessons later by swapping the JSON file.
 */

export interface LessonChunk {
  id: string;
  page: number;
  text: string;
  embedding?: number[];
}

export interface LessonIndex {
  chapter: string;
  subject: string;
  grade: number;
  board: string;
  chunks: LessonChunk[];
  ready: boolean;
}

// ── Cosine Similarity ────────────────────────────────────────────────────────
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ── Embed a single string via OpenAI ────────────────────────────────────────
async function embed(text: string, apiKey: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text.slice(0, 8000) }),
  });
  const data = await res.json();
  if (!data.data?.[0]?.embedding) throw new Error('Embedding failed: ' + JSON.stringify(data));
  return data.data[0].embedding as number[];
}

// ── Embed chunks in small batches to avoid rate limiting ───────────────────
async function embedBatch(texts: string[], apiKey: string): Promise<number[][]> {
  const BATCH = 20; // 20 chunks per API call (cost-efficient)
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: batch.map(t => t.slice(0, 8000)) }),
    });
    const data = await res.json();
    if (!data.data) throw new Error('Batch embedding failed at ' + i);
    // OpenAI returns embeddings in order
    const sorted = data.data.sort((a: any, b: any) => a.index - b.index);
    results.push(...sorted.map((d: any) => d.embedding as number[]));
  }
  return results;
}

// ── Main LessonRAG class ─────────────────────────────────────────────────────
export class LessonRAG {
  private index: LessonIndex | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the RAG index.
   * Fetches chunks from /lesson-chunks.json, generates embeddings.
   * Safe to call multiple times — only runs once.
   */
  async init(apiKey: string, onProgress?: (msg: string) => void): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        onProgress?.('Loading lesson chunks...');
        const res = await fetch('/lesson-chunks.json');
        if (!res.ok) throw new Error('Could not load lesson-chunks.json');
        const raw = await res.json();

        this.index = {
          chapter: raw.chapter,
          subject: raw.subject,
          grade: raw.grade,
          board: raw.board,
          chunks: raw.chunks as LessonChunk[],
          ready: false,
        };

        onProgress?.(`Indexing ${this.index.chunks.length} chunks...`);
        console.log(`[LessonRAG] Embedding ${this.index.chunks.length} chunks...`);

        const texts = this.index.chunks.map(c => c.text);
        const embeddings = await embedBatch(texts, apiKey);

        for (let i = 0; i < this.index.chunks.length; i++) {
          this.index.chunks[i].embedding = embeddings[i];
        }

        this.index.ready = true;
        console.log(`[LessonRAG] ✓ Index ready — ${this.index.chunks.length} chunks embedded.`);
        onProgress?.('Lesson index ready ✓');
      } catch (e) {
        console.error('[LessonRAG] Init failed:', e);
        onProgress?.('Lesson index failed (running without RAG)');
        // Don't reject — the system should still work without RAG
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  get isReady(): boolean {
    return this.index?.ready === true;
  }

  get meta(): { chapter: string; subject: string; grade: number; board: string } | null {
    if (!this.index) return null;
    return {
      chapter: this.index.chapter,
      subject: this.index.subject,
      grade: this.index.grade,
      board: this.index.board,
    };
  }

  /**
   * Retrieve top-K most relevant chunks for a given query.
   * Returns empty array if index is not ready.
   */
  async retrieve(query: string, apiKey: string, topK = 5): Promise<LessonChunk[]> {
    if (!this.isReady || !this.index) return [];
    try {
      const queryEmbedding = await embed(query, apiKey);
      const scored = this.index.chunks
        .filter(c => c.embedding)
        .map(c => ({ chunk: c, score: cosineSimilarity(queryEmbedding, c.embedding!) }));
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, topK).map(s => s.chunk);
    } catch (e) {
      console.warn('[LessonRAG] Retrieve failed:', e);
      return [];
    }
  }

  /**
   * Build a compact context string from retrieved chunks for injection into prompts.
   */
  formatContext(chunks: LessonChunk[]): string {
    if (chunks.length === 0) return '';
    return chunks
      .map((c, i) => `[Textbook p.${c.page}]: ${c.text.trim()}`)
      .join('\n\n');
  }
}

// Singleton export — one index per session
export const lessonRAG = new LessonRAG();
