// ──────────────────────────────────────────────
// Core types for the simulation platform.
// All simulation-related types live here.
// ──────────────────────────────────────────────

/** Simulation content providers — extensible for future integrations. */
export type Provider = "phet" | "geogebra" | "desmos" | "p5" | "custom";

/** Subjects offered in the simulation library. */
export type Subject = "Physics" | "Chemistry" | "Biology" | "Math";

/** Difficulty tiers shown on cards and used in filters. */
export type Difficulty = "beginner" | "intermediate" | "advanced";

/** Grade bands used for filtering and display. */
export type Grade = "K-2" | "3-5" | "6-8" | "9-12" | "College";

/** A single simulation entry in the registry. */
export interface Simulation {
  /** URL-safe unique identifier (e.g. "projectile-motion"). */
  id: string;

  /** Human-readable title. */
  title: string;

  /** Academic subject. */
  subject: Subject;

  /** Short description shown in the info panel. */
  description: string;

  /** Embeddable simulation URL (loaded in an iframe). */
  url: string;

  /** Content provider. */
  provider: Provider;

  /** Difficulty level. */
  difficulty: Difficulty;

  /** Applicable grade bands. */
  grades: Grade[];

  /** Searchable tags (lowercase). */
  tags: string[];

  /** Optional thumbnail image URL. */
  imageUrl?: string;
}

/** Active filter state used by the filter bar. */
export interface FilterState {
  subjects: Subject[];
  grades: Grade[];
  difficulties: Difficulty[];
}

/** Content generated for the learning panel. */
export interface LearningContent {
  conceptSummary: string;
  observations: string[];
  experiments: string[];
  learningGoals: string[];
}
