"use client";

import { useState, useMemo } from "react";
import type { FilterState } from "@/types/simulation";
import simulations from "@/data/simulations";
import { filterSimulations, groupBySubject } from "@/lib/filters";
import SearchBar from "@/components/SearchBar";
import FilterBar from "@/components/FilterBar";
import SimulationCard from "@/components/SimulationCard";
import SimulationViewer from "@/components/SimulationViewer";

const emptyFilters: FilterState = { subjects: [], grades: [], difficulties: [] };

export default function SimulationsPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [activeId, setActiveId] = useState(simulations[0].id);

  const filtered = useMemo(
    () => filterSimulations(simulations, query, filters),
    [query, filters]
  );
  const grouped = useMemo(() => groupBySubject(filtered), [filtered]);
  const activeSim = simulations.find((s) => s.id === activeId) ?? simulations[0];

  const hasActiveFilters =
    query.length > 0 || filters.subjects.length > 0 || filters.grades.length > 0 || filters.difficulties.length > 0;

  const renderSimList = () => {
    if (filtered.length === 0) {
      return <p className="mt-8 text-center text-sm text-slate-500">No simulations match your search.</p>;
    }
    if (hasActiveFilters) {
      return filtered.map((sim) => (
        <SimulationCard key={sim.id} simulation={sim} isActive={sim.id === activeId} onClick={() => setActiveId(sim.id)} />
      ));
    }
    return grouped.map(([subject, sims]) => (
      <div key={subject} className="mb-4">
        <h3 className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-sm px-1 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
          {subject} <span className="ml-2 text-slate-600">{sims.length}</span>
        </h3>
        {sims.map((sim) => (
          <SimulationCard key={sim.id} simulation={sim} isActive={sim.id === activeId} onClick={() => setActiveId(sim.id)} />
        ))}
      </div>
    ));
  };

  return (
    <div className="space-y-4 -mt-2">
      {/* Search + Filter */}
      <div className="flex flex-col gap-3">
        <SearchBar query={query} onChange={setQuery} />
        <FilterBar filters={filters} onChange={setFilters} resultCount={filtered.length} />
      </div>

      {/* Body */}
      <div className="flex gap-6">
        <nav className="hidden md:flex w-64 flex-shrink-0 flex-col gap-0.5 overflow-y-auto max-h-[calc(100vh-14rem)] pr-1">
          {renderSimList()}
        </nav>
        <section className="flex-1 min-w-0">
          <SimulationViewer simulation={activeSim} />
        </section>
      </div>
    </div>
  );
}
