"use client";

/**
 * PDFViewer — canvas-based NCERT PDF renderer with accurate text-layer highlighting
 *
 * How highlights work:
 *   pdfjs gives us TextItem[] where each item has:
 *     transform: [scaleX, skewX, skewY, scaleY, translateX, translateY]  (PDF user-space coords)
 *     width, height: in PDF user-space
 *     str: the text string
 *
 *   PDF y-axis is bottom-up; canvas/DOM is top-down.
 *   We build one absolutely-positioned <span> per text item, sized and placed to
 *   exactly match the rendered canvas text.  When a keyword matches we swap the
 *   span's background to yellow — the text itself stays on the canvas, the span
 *   is fully transparent so the highlight sits perfectly on top.
 *
 *   ScaleX is applied AFTER the span is in the DOM so offsetWidth is real.
 */

import { useEffect, useRef, useState, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface TextItem {
  str: string;
  transform: number[];   // [a, b, c, d, e, f]  — standard PDF CTM
  width: number;         // advance width in PDF user-space units
  height: number;
  fontName?: string;
  hasEOL?: boolean;
}

interface PDFViewport {
  width: number;
  height: number;
  // pdfjs also exposes convertToViewportPoint etc., but we only need dimensions here
}

interface PDFPageProxy {
  getViewport(params: { scale: number }): PDFViewport;
  render(params: { canvasContext: CanvasRenderingContext2D; viewport: PDFViewport }): { promise: Promise<void> };
  getTextContent(): Promise<{ items: TextItem[] }>;
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

const SCALE = 1.6;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build the text layer for one page, with keyword highlights. */
function buildTextLayer(
  container: HTMLDivElement,
  items: TextItem[],
  viewport: PDFViewport,
  lowerKeywords: string[]
) {
  container.innerHTML = "";

  items.forEach((item) => {
    if (!item.str.trim()) return;

    // PDF CTM: [a, b, c, d, e, f]
    // e = tx (x translate in user-space), f = ty (y translate in user-space)
    // d = scaleY component (font size in user-space, approximately)
    const [a, , , d, e, f] = item.transform;

    // Convert from PDF user-space to scaled canvas-space
    const x = e * SCALE;
    // PDF y is bottom-up; flip to top-down.  `f` is in user-space.
    const y = viewport.height - f * SCALE;

    // Font size = absolute value of the d component * SCALE
    const fontSize = Math.abs(d) * SCALE;

    // Horizontal stretch: if `a` differs from `d` the font is artificially scaled.
    // We store the raw scaleX factor and apply it after the span is in DOM.
    const pdfScaleX = Math.abs(a) / (Math.abs(d) || 1);

    const span = document.createElement("span");
    span.dataset.pdfScaleX = String(pdfScaleX);
    span.dataset.pdfWidth = String(item.width * SCALE);

    // Keyword match?
    const lower = item.str.toLowerCase();
    const isHighlighted = lowerKeywords.length > 0 && lowerKeywords.some((kw) => lower.includes(kw));

    span.style.cssText = [
      "position:absolute",
      `left:${x}px`,
      `top:${y - fontSize}px`,      // top = baseline - fontSize (ascender approx)
      `font-size:${fontSize}px`,
      "font-family:sans-serif",
      "line-height:1",
      "white-space:nowrap",
      "transform-origin:0% 100%",   // scale from bottom-left (baseline)
      "color:transparent",
      "user-select:text",
      "cursor:text",
      // Highlighted spans get a yellow background; others are invisible
      isHighlighted
        ? "background:rgba(253,224,71,0.55);border-radius:2px;box-shadow:0 0 0 1px rgba(253,224,71,0.4)"
        : "background:transparent",
    ].join(";");

    span.textContent = item.str;
    container.appendChild(span);
  });

  // Fix scaleX for every span now that they are in the DOM and offsetWidth is real
  Array.from(container.children).forEach((child) => {
    const span = child as HTMLSpanElement;
    const pdfScaleX = parseFloat(span.dataset.pdfScaleX ?? "1");
    const targetWidth = parseFloat(span.dataset.pdfWidth ?? "0");
    const naturalWidth = span.offsetWidth;
    if (naturalWidth > 0 && targetWidth > 0) {
      span.style.transform = `scaleX(${(targetWidth / naturalWidth) * pdfScaleX})`;
    } else if (pdfScaleX !== 1) {
      span.style.transform = `scaleX(${pdfScaleX})`;
    }
  });
}

// ── PDFPage ───────────────────────────────────────────────────────────────────
function PDFPage({
  page,
  highlightKeywords,
  pageNum,
}: {
  page: PDFPageProxy;
  highlightKeywords: string[];
  pageNum: number;
}) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const layerRef   = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);
  const keywordsRef = useRef<string[]>([]);

  // ── Render canvas (only once per page) ────────────────────────────────────
  useEffect(() => {
    if (renderedRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const viewport = page.getViewport({ scale: SCALE });
    canvas.width  = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cancelled = false;
    page.render({ canvasContext: ctx, viewport }).promise.then(async () => {
      if (cancelled) return;
      renderedRef.current = true;

      // Build initial text layer
      try {
        const content = await page.getTextContent();
        if (cancelled || !layerRef.current) return;
        layerRef.current.style.width  = `${viewport.width}px`;
        layerRef.current.style.height = `${viewport.height}px`;
        const lk = keywordsRef.current
          .map((k) => k.toLowerCase().trim())
          .filter(Boolean)
          .flatMap((k) => k.split(/[\s-]+/))
          .filter((w) => w.length >= 3);
        buildTextLayer(layerRef.current, content.items, viewport, lk);
      } catch (_) { /* text extraction failed — highlights just won't show */ }
    }).catch(() => {});

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // ── Re-draw highlights when keywords change (no re-render canvas) ─────────
  useEffect(() => {
    keywordsRef.current = highlightKeywords;
    if (!renderedRef.current || !layerRef.current) return;

    const viewport = page.getViewport({ scale: SCALE });
    const lk = highlightKeywords
      .map((k) => k.toLowerCase().trim())
      .filter(Boolean)
      .flatMap((k) => k.split(/[\s-]+/))
      .filter((w) => w.length >= 3);

    page.getTextContent().then((content) => {
      if (!layerRef.current) return;
      buildTextLayer(layerRef.current, content.items, viewport, lk);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightKeywords]);

  return (
    <div className="relative bg-white shadow-xl mx-auto mb-5" style={{ width: "fit-content" }}>
      <canvas ref={canvasRef} className="block" />
      {/* Text layer — absolutely on top of canvas, transparent text, coloured background for highlights */}
      <div
        ref={layerRef}
        className="absolute inset-0 overflow-hidden"
        style={{ pointerEvents: "none", userSelect: "text" }}
      />
      <div className="absolute bottom-2 right-3 text-[10px] text-slate-400/70 bg-black/20 px-1.5 py-0.5 rounded-full select-none pointer-events-none">
        {pageNum}
      </div>
    </div>
  );
}

// ── Main PDFViewer ────────────────────────────────────────────────────────────
export default function PDFViewer({
  src,
  highlightKeywords = [],
  onLoadSuccess,
  onError,
}: Props) {
  const [pages,     setPages]     = useState<PDFPageProxy[]>([]);
  const [numPages,  setNumPages]  = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [scrollPage, setScrollPage] = useState(1);
  const [jumpVal,   setJumpVal]   = useState(1);

  const docRef      = useRef<PDFDocumentProxy | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs    = useRef<Record<number, HTMLDivElement>>({});

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setPages([]);
    setNumPages(0);
    setScrollPage(1);
    setJumpVal(1);
    pageRefs.current = {};

    import("pdfjs-dist").then(async (pdfjs) => {
      if (cancelled) return;
      pdfjs.GlobalWorkerOptions.workerSrc =
        `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      try {
        const task = pdfjs.getDocument({
          url: src,
          cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
          cMapPacked: true,
        });
        const doc = await task.promise;
        if (cancelled) { doc.destroy(); return; }

        docRef.current = doc as unknown as PDFDocumentProxy;
        const total = doc.numPages;
        setNumPages(total);
        onLoadSuccess?.(total);

        const eager = Math.min(total, 25);
        const arr: PDFPageProxy[] = [];
        for (let i = 1; i <= eager; i++) {
          if (cancelled) break;
          arr.push((await (doc as any).getPage(i)) as PDFPageProxy);
        }
        if (!cancelled) { setPages(arr); setLoading(false); }
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

  // ── Scroll tracking ───────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = () => {
      const top = el.scrollTop;
      const bot = top + el.clientHeight;
      let best = 1, bestVis = 0;
      Object.entries(pageRefs.current).forEach(([n, div]) => {
        if (!div) return;
        const vis = Math.max(0, Math.min(div.offsetTop + div.offsetHeight, bot) - Math.max(div.offsetTop, top));
        if (vis > bestVis) { bestVis = vis; best = parseInt(n); }
      });
      setScrollPage(best);
    };
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, [pages.length]);

  // ── Auto-scroll to first highlight ───────────────────────────────────────
  useEffect(() => {
    if (!highlightKeywords.length || !containerRef.current) return;
    const t = setTimeout(() => {
      // Find first span with yellow background inside any page
      const first = containerRef.current?.querySelector<HTMLSpanElement>(
        'span[style*="rgba(253,224,71"]'
      );
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 400);
    return () => clearTimeout(t);
  }, [highlightKeywords]);

  const goToPage = useCallback((n: number) => {
    const el = pageRefs.current[n];
    if (el && containerRef.current) {
      containerRef.current.scrollTo({ top: el.offsetTop - 12, behavior: "smooth" });
    }
    setJumpVal(n);
  }, []);

  // ── States ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-slate-950">
      <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-400">Loading PDF…</p>
      <p className="text-xs text-slate-600 text-center max-w-xs">Fetching from NCERT. May take a few seconds.</p>
    </div>
  );

  if (loadError) return null; // parent shows fallback

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
      {/* Toolbar */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-1.5 border-b border-slate-800 bg-slate-950/80">
        <button onClick={() => goToPage(Math.max(1, scrollPage - 1))} disabled={scrollPage <= 1}
          className="px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition">
          ‹ Prev
        </button>
        <span className="text-xs text-slate-500 tabular-nums w-16 text-center">{scrollPage} / {numPages}</span>
        <button onClick={() => goToPage(Math.min(numPages, scrollPage + 1))} disabled={scrollPage >= numPages}
          className="px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition">
          Next ›
        </button>

        <input
          type="number" min={1} max={numPages} value={jumpVal}
          onChange={(e) => setJumpVal(Number(e.target.value))}
          onKeyDown={(e) => e.key === "Enter" && goToPage(jumpVal)}
          title="Jump to page (press Enter)"
          className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-indigo-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />

        {highlightKeywords.length > 0 && (
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-yellow-300/90 inline-block" />
            <span className="text-[11px] text-slate-400">
              Highlighting: <span className="text-yellow-300 font-medium">
                {highlightKeywords.slice(0, 3).join(", ")}{highlightKeywords.length > 3 ? ` +${highlightKeywords.length - 3}` : ""}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Pages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-auto p-6 bg-slate-700">
        <div className="flex flex-col items-center min-w-max">
          {pages.map((p, i) => (
            <div key={i} ref={(el) => { if (el) pageRefs.current[i + 1] = el; }}>
              <PDFPage page={p} highlightKeywords={highlightKeywords} pageNum={i + 1} />
            </div>
          ))}
          {pages.length < numPages && (
            <p className="text-xs text-slate-500 py-4">Showing first {pages.length} of {numPages} pages</p>
          )}
        </div>
      </div>
    </div>
  );
}
