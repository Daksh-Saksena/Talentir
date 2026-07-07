// ──────────────────────────────────────────────
// Search & filter utilities.
// Pure functions — no React dependency.
// ──────────────────────────────────────────────

import type { Simulation, FilterState } from "@/types/simulation";

/**
 * Returns true if a simulation matches the current search query.
 * Searches across title, subject, description, and tags.
 */
export function matchesSearch(sim: Simulation, query: string): boolean {
  if (!query) return true;

  const q = query.toLowerCase();
  return (
    sim.title.toLowerCase().includes(q) ||
    sim.subject.toLowerCase().includes(q) ||
    sim.description.toLowerCase().includes(q) ||
    sim.tags.some((tag) => tag.includes(q))
  );
}

/**
 * Returns true if a simulation passes all active filters.
 * An empty filter array means "show all" for that category.
 */
export function matchesFilters(sim: Simulation, filters: FilterState): boolean {
  const { subjects, grades, difficulties } = filters;

  if (subjects.length > 0 && !subjects.includes(sim.subject)) return false;

  if (
    grades.length > 0 &&
    !sim.grades.some((g) => grades.includes(g))
  )
    return false;

  if (difficulties.length > 0 && !difficulties.includes(sim.difficulty))
    return false;

  return true;
}

/**
 * Combined search + filter in one pass.
 */
export function filterSimulations(
  simulations: Simulation[],
  query: string,
  filters: FilterState
): Simulation[] {
  return simulations.filter(
    (sim) => matchesSearch(sim, query) && matchesFilters(sim, filters)
  );
}

/**
 * Groups a flat simulation list by subject, preserving order.
 * Returns an array of [Subject, Simulation[]] tuples.
 */
export function groupBySubject(
  sims: Simulation[]
): [string, Simulation[]][] {
  const map = new Map<string, Simulation[]>();

  for (const sim of sims) {
    const group = map.get(sim.subject) ?? [];
    group.push(sim);
    map.set(sim.subject, group);
  }

  return Array.from(map.entries());
}
