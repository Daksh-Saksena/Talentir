"use client";

/**
 * PDFViewer
 * ─────────────────────────────────────────────────────────────────────────────
 * Canvas-based PDF renderer using pdfjs-dist.
 * Renders each page to a <canvas>, then overlays a transparent text layer.
 * When `highlightKeywords` is provided, matching text runs are wrapped in
 * <mark> elements with animated yellow highlight styling.
 *
 * Props:
 *   src             – proxy URL (/api/pdf-proxy?url=...)
 *   highlightKeywords – array of keyword strings to highlight
 *   onLoadSuccess   – called with total page count after load
 *   onError         – called if PDF fails to load
 */

import { useEffect, useRef, useState, useCallback } from "react";

// ── Types (avoid importing heavy pdfjs types directly in component) ──────────
interface PDFPageProxy {
  getViewport(params: { scale: number }): { width: number; height: number };
  render(params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }): { promise: Promise<void> };
  getTextContent(): Promise<{
    items: Array<{
      str: string;
      transform: number[];
      width: number;
      height: number;
      fontName?: string;
    }>;
  }>;
}

interface PDFDocumentProxy {
  numPages: number;
  getPage(pageNum: number): Promise<PDFPageProxy>;
  destroy(): void;
}

interface Props {
  src: string;
  highlightKeywords?: string[];
  onLoadSuccess?: (numPages: number) => void;
  onError?: (err: string) => void;
}

// ── Scale helpers ────────────────────────────────────────────────────────────
const SCALE = 1.8; // base render scale — good balance of quality vs performance

// ── Single page component ────────────────────────────────────────────────────
function PDFPage({
  page,
  highlightKeywords = [],
  pageNum,
}: {
  page: PDFPageProxy;
  highlightKeywords: string[];
  pageNum: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    const textLayer = textLayerRef.current;
    if (!canvas || !textLayer) return;

    const viewport = page.getViewport({ scale: SCALE });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Render canvas
    page
      .render({ canvasContext: ctx, viewport })
      .promise.then(async () => {
        if (cancelled) return;
        setRendered(true);

        // Build text layer
        const content = await page.getTextContent();
        if (cancelled) return;
        textLayer.innerHTML = "";
        textLayer.style.width = `${viewport.width}px`;
        textLayer.style.height = `${viewport.height}px`;

        const lowerKeywords = highlightKeywords
          .map((k) => k.toLowerCase().trim())
          .filter(Boolean);

        content.items.forEach((item) => {
          if (!item.str.trim()) return;

          const span = document.createElement("span");
          // Position using transform matrix: [scaleX, skewX, skewY, scaleY, tx, ty]
          const [, , , scaleY, tx, ty] = item.transform;
          const fontSize = Math.abs(scaleY) * SCALE;

          span.style.cssText = `
            position: absolute;
            left: ${tx * SCALE}px;
            top: ${viewport.height - ty * SCALE}px;
            font-size: ${fontSize}px;
            font-family: sans-serif;
            white-space: nowrap;
            transform-origin: 0% 100%;
            transform: scaleX(${item.width > 0 ? (item.width * SCALE) / (span.offsetWidth || 1) : 1});
            color: transparent;
            user-select: text;
            cursor: text;
          `;

          // Check for keyword matches
          const lower = item.str.toLowerCase();
          const matched = lowerKeywords.some((kw) => lower.includes(kw));

          if (matched) {
            const mark = document.createElement("mark");
            mark.textContent = item.str;
            mark.className = "pdf-highlight";
            span.appendChild(mark);
          } else {
            span.textContent = item.str;
          }

          textLayer.appendChild(span);
        });

        // Fix scaleX now that spans are in DOM
        textLayer.querySelectorAll("span").forEach((s) => {
          const span = s as HTMLSpanElement;
          const canvas = canvasRef.current;
          if (!canvas) return;
          // Re-read actual rendered width and scale to match PDF word width
          const pdfItem = content.items.find((it) => {
            return span.textContent?.includes(it.str) && it.width > 0;
          });
          if (pdfItem && pdfItem.width > 0) {
            const naturalWidth = span.offsetWidth;
            if (naturalWidth > 0) {
              const targetWidth = pdfItem.width * SCALE;
              span.style.transform = `scaleX(${targetWidth / naturalWidth})`;
            }
          }
        });
      })
      .catch(() => {
        if (!cancelled) setRendered(true); // still show page even if text extraction fails
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, highlightKeywords.join(",")]);

  return (
    <div
      className="relative bg-white shadow-lg mx-auto mb-4"
      style={{ width: "fit-content" }}
      data-page={pageNum}
    >
      <canvas ref={canvasRef} className="block" />
      {/* Text layer — transparent, sits over canvas for selection + highlights */}
      <div
        ref={textLayerRef}
        className="absolute inset-0 overflow-hidden select-text"
        style={{ pointerEvents: "none" }}
      />
      {/* Page number badge */}
      <div className="absolute bottom-2 right-3 text-[10px] text-slate-400 bg-black/30 px-2 py-0.5 rounded-full select-none">
        {pageNum}
      </div>
    </div>
  );
}

// ── Main PDFViewer ────────────────────────────────────────────────────────────
export default function PDFViewer({ src, highlightKeywords = [], onLoadSuccess, onError }: Props) {
  const [pages, setPages] = useState<PDFPageProxy[]>([]);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scrollPage, setScrollPage] = useState(1);
  const docRef = useRef<PDFDocumentProxy | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement>>({});

  // ── Load PDF via pdfjs ───────────────────────────────────────────────────
  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setPages([]);
    setNumPages(0);
    setCurrentPage(1);

    // Dynamically import pdfjs to avoid SSR issues
    import("pdfjs-dist").then(async (pdfjs) => {
      if (cancelled) return;

      // Point worker to CDN (avoids bundling 3MB worker)
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      try {
        const loadingTask = pdfjs.getDocument({
          url: src,
          cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
          cMapPacked: true,
        });
        const doc = await loadingTask.promise;
        if (cancelled) { doc.destroy(); return; }

        docRef.current = doc as unknown as PDFDocumentProxy;
        const total = doc.numPages;
        setNumPages(total);
        onLoadSuccess?.(total);

        // Load all pages (up to 30 for perf; rest lazy-loaded via scroll)
        const maxEager = Math.min(total, 30);
        const pageArr: PDFPageProxy[] = [];
        for (let i = 1; i <= maxEager; i++) {
          if (cancelled) break;
          const p = await (doc as any).getPage(i);
          pageArr.push(p as PDFPageProxy);
        }
        if (!cancelled) setPages(pageArr);
        setLoading(false);
      } catch (e: any) {
        if (!cancelled) {
          const msg = e?.message ?? "Failed to load PDF";
          setLoadError(msg);
          setLoading(false);
          onError?.(msg);
        }
      }
    });

    return () => {
      cancelled = true;
      docRef.current?.destroy();
      docRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // ── Scroll tracking → page indicator ────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handler = () => {
      // Find which page is most visible in the viewport
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;
      let bestPage = 1;
      let bestVisible = 0;
      Object.entries(pageRefs.current).forEach(([numStr, el]) => {
        if (!el) return;
        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;
        const visible = Math.max(0, Math.min(bottom, containerBottom) - Math.max(top, containerTop));
        if (visible > bestVisible) {
          bestVisible = visible;
          bestPage = parseInt(numStr);
        }
      });
      setScrollPage(bestPage);
    };
    container.addEventListener("scroll", handler, { passive: true });
    return () => container.removeEventListener("scroll", handler);
  }, [pages.length]);

  // ── Jump to page ─────────────────────────────────────────────────────────
  const goToPage = useCallback((page: number) => {
    const el = pageRefs.current[page];
    if (el && containerRef.current) {
      containerRef.current.scrollTo({ top: el.offsetTop - 16, behavior: "smooth" });
    }
    setCurrentPage(page);
  }, []);

  // ── Auto-scroll to first highlight when keywords change ──────────────────
  useEffect(() => {
    if (!highlightKeywords.length || !containerRef.current) return;
    // Small delay to let marks render
    const t = setTimeout(() => {
      const mark = containerRef.current?.querySelector(".pdf-highlight");
      if (mark) {
        (mark as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 600);
    return () => clearTimeout(t);
  }, [highlightKeywords]);

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-slate-950 text-slate-400">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Loading PDF…</p>
        <p className="text-xs text-slate-600 max-w-xs text-center">
          Fetching from NCERT via proxy. This may take a few seconds.
        </p>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (loadError) {
    return null; // parent handles fallback
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
      {/* ── Toolbar ── */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-1.5 border-b border-slate-800 bg-slate-950/80">
        <div className="flex items-center gap-1">
          <button
            onClick={() => goToPage(Math.max(1, scrollPage - 1))}
            disabled={scrollPage <= 1}
            className="px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition"
          >
            ‹ Prev
          </button>
          <span className="text-xs text-slate-500 px-1 tabular-nums">
            {scrollPage} / {numPages}
          </span>
          <button
            onClick={() => goToPage(Math.min(numPages, scrollPage + 1))}
            disabled={scrollPage >= numPages}
            className="px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition"
          >
            Next ›
          </button>
        </div>

        {/* Jump to page */}
        <input
          type="number"
          min={1}
          max={numPages}
          value={currentPage}
          onChange={(e) => setCurrentPage(Number(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") goToPage(currentPage);
          }}
          className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-indigo-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          title="Jump to page"
        />

        {/* Highlight indicator */}
        {highlightKeywords.length > 0 && (
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="w-3 h-3 rounded-sm bg-yellow-300/90" />
            <span className="text-[11px] text-slate-400">
              Highlighting:{" "}
              <span className="text-yellow-300 font-medium">
                {highlightKeywords.slice(0, 3).join(", ")}
                {highlightKeywords.length > 3 ? ` +${highlightKeywords.length - 3}` : ""}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* ── Pages ── */}
      <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-auto p-6 bg-slate-800">
        <div className="flex flex-col items-center min-w-max">
          {pages.map((p, i) => (
            <div
              key={i}
              ref={(el) => {
                if (el) pageRefs.current[i + 1] = el;
              }}
            >
              <PDFPage page={p} highlightKeywords={highlightKeywords} pageNum={i + 1} />
            </div>
          ))}
          {pages.length < numPages && (
            <p className="text-xs text-slate-600 py-4">
              Showing first {pages.length} of {numPages} pages
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
