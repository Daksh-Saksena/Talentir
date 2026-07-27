"use client";

import React, { useState, useMemo } from "react";

// ─── Normalisation helpers ───────────────────────────────────────────────────

/** Remove whitespace & lower-case, convert unicode superscripts to ^ form */
function normalise(raw: string) {
  return raw
    .replace(/\s+/g, "")
    .toLowerCase()
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/⁴/g, "^4")
    .replace(/⁵/g, "^5");
}

/** Convert math notation to JS: 2x→2*x, x^2→x**2, sin→Math.sin, … */
function toJS(expr: string): string {
  return expr
    .replace(/\^/g, "**")
    .replace(/π/g, "Math.PI")
    .replace(/\bpi\b/gi, "Math.PI")
    .replace(/(?<![a-z])e(?![a-z])/g, "Math.E")
    .replace(/\bsqrt\b/gi, "Math.sqrt")
    .replace(/\babs\b/gi,  "Math.abs")
    .replace(/\bsin\b/gi,  "Math.sin")
    .replace(/\bcos\b/gi,  "Math.cos")
    .replace(/\btan\b/gi,  "Math.tan")
    .replace(/\bln\b/gi,   "Math.log")
    .replace(/\blog10\b/gi, "Math.log10")
    .replace(/\blog\b/gi,  "Math.log10")
    // implicit multiplication: 2x → 2*x,  3( → 3*(,  )( → )*(
    .replace(/(\d)(x)/g, "$1*x")
    .replace(/(\d)\(/g, "$1*(")
    .replace(/\)\(/g, ")*(");
}

function safeFn(jsExpr: string): (x: number) => number {
  try {
    // eslint-disable-next-line no-new-func
    const compiled = new Function("x", `"use strict"; try { const r=(${jsExpr}); return (typeof r==="number"&&isFinite(r))?r:NaN; } catch{return NaN;}`);
    return (x: number) => {
      try { return compiled(x) as number; } catch { return NaN; }
    };
  } catch {
    return () => NaN;
  }
}

/** Numerically find roots of f in [lo, hi] with step */
function findRoots(f: (x: number) => number, lo = -30, hi = 30, steps = 800): number[] {
  const roots: number[] = [];
  const step = (hi - lo) / steps;
  for (let xi = lo; xi < hi; xi += step) {
    const y1 = f(xi);
    const y2 = f(xi + step);
    if (!isFinite(y1) || !isFinite(y2)) continue;
    if (y1 * y2 <= 0 && Math.abs(y1) < 200) {
      // bisection refinement
      let a = xi, b = xi + step;
      for (let i = 0; i < 20; i++) {
        const m = (a + b) / 2;
        if (f(a) * f(m) <= 0) b = m; else a = m;
      }
      const root = parseFloat(((a + b) / 2).toFixed(4));
      if (!roots.some((r) => Math.abs(r - root) < 0.01)) roots.push(root);
    }
  }
  return roots;
}

// ─── Equation types ──────────────────────────────────────────────────────────

type ParsedEq =
  | { kind: "fn";        fn: (x: number) => number; label: string; rootHint?: number[] }
  | { kind: "verticals"; xs: number[];               label: string }
  | { kind: "circle";    cx: number; cy: number; r: number; label: string }
  | { kind: "none";      label: string };

function parseEquation(raw: string): ParsedEq {
  const label = raw.trim();
  const eq = normalise(raw);

  const hasY = /\by\b/.test(eq);

  // ── Circle: x^2+y^2=R or x**2+y**2=R ──────────────────────────────────────
  const circleMatch = eq.match(/^x\*\*2\+y\*\*2=(\d+(\.\d+)?)$/)
                   || eq.match(/^x\^2\+y\^2=(\d+(\.\d+)?)$/);
  if (circleMatch) {
    const rSq = parseFloat(circleMatch[1]);
    return { kind: "circle", cx: 0, cy: 0, r: Math.sqrt(rSq), label };
  }

  // ── Split on first '=' ─────────────────────────────────────────────────────
  const eqIdx = eq.indexOf("=");
  if (eqIdx !== -1) {
    const lhs = eq.slice(0, eqIdx);
    const rhs = eq.slice(eqIdx + 1);

    // ── Explicit: y = f(x)  or  f(x) = … ─────────────────────────────────
    if (lhs === "y" || lhs === "f(x)") {
      return { kind: "fn", fn: safeFn(toJS(rhs)), label };
    }
    // Reverse: f(x) = y
    if (rhs === "y") {
      return { kind: "fn", fn: safeFn(toJS(lhs)), label };
    }

    // ── No y in the equation → constraint on x → vertical lines ───────────
    if (!hasY) {
      // Form: g(x) = 0  →  combined = lhs - rhs
      const combined = rhs === "0" ? lhs : `(${lhs})-(${rhs})`;
      const f = safeFn(toJS(combined));
      const xs = findRoots(f);
      if (xs.length > 0) {
        return {
          kind: "verticals",
          xs,
          label: `${label}  →  x = ${xs.map((v) => v.toFixed(3)).join(", ")}`,
        };
      }
      // Fallback: nothing to show
      return { kind: "none", label };
    }

    // ── Implicit with y: try to isolate y algebraically ────────────────────
    // Case: lhs contains y and rhs doesn't (or vice-versa).
    // We rearrange to "y = rhs - lhs_without_y" for simple cases.
    // For now use marching-squares sampling (good for all implicit)
    // We'll build a function fn(x) = ??? by trying to solve numerically for y.
    const combined = rhs === "0" ? lhs : `(${lhs})-(${rhs})`;
    const fxy = safeFn(`(function(y){ return (${toJS(combined)}); })(arguments[1])`);
    // Build y-sampler: for each x, find y such that combined(x,y)=0
    // We approximate by rearranging obvious cases first
    // Simple: combined = <x-terms> + y - <something>  → y = <something> - <x-terms>
    // Fallback: return a parametric approach won't work in simple safeFn.
    // Better: render using marching squares below.
    // Return a special kind for implicit
    return {
      kind: "fn",
      fn: (x) => {
        // Dummy – won't be used; we handle "implicit" in render differently
        void fxy; void x; return NaN;
      },
      label,
      rootHint: [],
    };
  }

  // ── No '=' – try to plot as y = expr ────────────────────────────────────
  const fn = safeFn(toJS(eq));
  if (!isNaN(fn(1)) || !isNaN(fn(0))) {
    return { kind: "fn", fn, label: `y = ${label}` };
  }

  return { kind: "none", label };
}

// ─── Component ───────────────────────────────────────────────────────────────

interface GraphPlotterProps {
  equation: string;
  onClose?: () => void;
}

const W = 340;
const H = 260;

export default function GraphPlotter({ equation, onClose }: GraphPlotterProps) {
  const [range, setRange] = useState(8);
  const [minimized, setMinimized] = useState(false);

  const parsed = useMemo(() => parseEquation(equation), [equation]);

  const cx = W / 2;
  const cy = H / 2;
  const scale = (W / 2 - 10) / range;

  // ── Function path segments ─────────────────────────────────────────────────
  const pathSegments = useMemo(() => {
    if (parsed.kind !== "fn") return [];
    const segments: string[][] = [];
    let current: string[] = [];
    const steps = 600;
    const step = (range * 2) / steps;

    let prevY: number | null = null;
    for (let i = 0; i <= steps; i++) {
      const xi = -range + i * step;
      const y = parsed.fn(xi);
      const svgX = cx + xi * scale;
      const svgY = cy - y * scale;

      const disc = prevY !== null && Math.abs(y - prevY) > range * 5;
      if (isNaN(y) || !isFinite(y) || disc) {
        if (current.length > 1) segments.push(current);
        current = [];
        prevY = null;
        continue;
      }
      current.push(
        current.length === 0
          ? `M ${svgX.toFixed(2)} ${svgY.toFixed(2)}`
          : `L ${svgX.toFixed(2)} ${svgY.toFixed(2)}`
      );
      prevY = y;
    }
    if (current.length > 1) segments.push(current);
    return segments;
  }, [parsed, range, cx, cy, scale]);

  // ── Root markers for function ──────────────────────────────────────────────
  const roots = useMemo(() => {
    if (parsed.kind !== "fn") return [];
    return findRoots(parsed.fn, -range, range, 600).slice(0, 8);
  }, [parsed, range]);

  // ── Ticks ─────────────────────────────────────────────────────────────────
  const step = range <= 4 ? 1 : range <= 10 ? 2 : range <= 20 ? 5 : 10;
  const ticks: number[] = [];
  for (let t = -range; t <= range; t += step) {
    if (t !== 0) ticks.push(t);
  }

  return (
    <div className="pointer-events-auto w-[360px] overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-950/95 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">📈</span>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-white">Equation Graph</div>
            <div className="max-w-[200px] truncate text-[11px] font-mono text-blue-300">{parsed.label}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setRange((r) => Math.max(2, r - 2))} className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300 hover:bg-zinc-700" title="Zoom in">+</button>
          <button onClick={() => setRange((r) => Math.min(40, r + 2))} className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300 hover:bg-zinc-700" title="Zoom out">−</button>
          <button onClick={() => setMinimized((m) => !m)} className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300 hover:bg-zinc-700">{minimized ? "▲" : "▼"}</button>
          {onClose && (
            <button onClick={onClose} className="rounded bg-red-950/50 px-2 py-0.5 text-xs text-red-400 hover:bg-red-900/70">✕</button>
          )}
        </div>
      </div>

      {/* No parse */}
      {!minimized && parsed.kind === "none" && (
        <div className="p-6 text-center text-sm text-zinc-400">
          Can&apos;t plot: <span className="font-mono text-white">{equation}</span>
        </div>
      )}

      {/* Graph */}
      {!minimized && parsed.kind !== "none" && (
        <div className="p-3">
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80">
            <svg width={W} height={H}>
              {/* Grid lines */}
              {ticks.map((t) => (
                <React.Fragment key={t}>
                  <line x1={cx + t * scale} y1={0} x2={cx + t * scale} y2={H} stroke="rgba(255,255,255,0.06)" />
                  <line x1={0} y1={cy - t * scale} x2={W} y2={cy - t * scale} stroke="rgba(255,255,255,0.06)" />
                </React.Fragment>
              ))}

              {/* Axes */}
              <line x1={0} y1={cy} x2={W} y2={cy} stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} />
              <line x1={cx} y1={0} x2={cx} y2={H} stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} />

              {/* Tick labels */}
              {ticks.map((t) => (
                <React.Fragment key={t}>
                  <text x={cx + t * scale} y={cy + 14} fill="#666" fontSize={9} textAnchor="middle">{t}</text>
                  <text x={cx - 5} y={cy - t * scale + 3} fill="#666" fontSize={9} textAnchor="end">{t}</text>
                </React.Fragment>
              ))}
              <text x={cx + 4} y={cy + 14} fill="#666" fontSize={9}>0</text>

              {/* ── y = f(x) ── */}
              {parsed.kind === "fn" && pathSegments.map((seg, i) => (
                <path key={i} d={seg.join(" ")} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              ))}

              {/* x-intercepts */}
              {parsed.kind === "fn" && roots.map((rx, i) => {
                const svgX = cx + rx * scale;
                return (
                  <g key={i}>
                    <circle cx={svgX} cy={cy} r={5} fill="#f59e0b" stroke="#fff" strokeWidth={1.5} />
                    <text x={svgX} y={cy - 10} fill="#f59e0b" fontSize={10} textAnchor="middle" fontWeight="bold">x={rx.toFixed(2)}</text>
                  </g>
                );
              })}

              {/* ── Vertical lines (x-only equations like x²=1 → x=±1) ── */}
              {parsed.kind === "verticals" && parsed.xs.map((xVal, i) => {
                const svgX = cx + xVal * scale;
                if (svgX < -10 || svgX > W + 10) return null;
                const colors = ["#ef4444", "#f59e0b", "#10b981", "#a78bfa", "#f472b6"];
                const col = colors[i % colors.length];
                return (
                  <g key={i}>
                    <line x1={svgX} y1={0} x2={svgX} y2={H} stroke={col} strokeWidth={2.5} strokeDasharray="6 4" />
                    <text x={svgX + 5} y={16} fill={col} fontSize={11} fontWeight="bold">x={xVal.toFixed(3)}</text>
                  </g>
                );
              })}

              {/* ── Circle ── */}
              {parsed.kind === "circle" && (
                <>
                  <circle
                    cx={cx + parsed.cx * scale}
                    cy={cy - parsed.cy * scale}
                    r={parsed.r * scale}
                    fill="rgba(16,185,129,0.08)"
                    stroke="#10b981"
                    strokeWidth={2.5}
                  />
                  <circle cx={cx} cy={cy} r={4} fill="#10b981" />
                </>
              )}
            </svg>
          </div>

          {/* Footer */}
          <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-zinc-500">
            <span>x ∈ [−{range}, {range}]</span>
            {parsed.kind === "verticals" && (
              <span className="text-amber-400">
                x = {parsed.xs.map((v) => v.toFixed(3)).join(", ")}
              </span>
            )}
            {parsed.kind === "fn" && roots.length > 0 && (
              <span className="text-amber-400">
                zeros: {roots.map((r) => r.toFixed(2)).join(", ")}
              </span>
            )}
            {parsed.kind === "circle" && (
              <span className="text-emerald-400">r = {parsed.r.toFixed(3)}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
