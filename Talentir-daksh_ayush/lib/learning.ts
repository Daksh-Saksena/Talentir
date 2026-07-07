// ──────────────────────────────────────────────
// Learning content generator.
// Produces contextual educational prompts from
// simulation metadata — no AI API needed.
// ──────────────────────────────────────────────

import type { Simulation, LearningContent } from "@/types/simulation";

// ── Subject-specific observation templates ────

const observationsBySubject: Record<string, string[]> = {
  Physics: [
    "How does changing one variable affect the motion or forces?",
    "What patterns do you notice in the measurements?",
    "Can you identify the relationship between input and output?",
    "What happens at extreme values (very large or very small)?",
  ],
  Chemistry: [
    "What changes when you adjust the amount of a substance?",
    "How does the molecular structure relate to the behavior?",
    "Can you predict what happens before running the simulation?",
    "What stays the same and what changes during the reaction?",
  ],
  Biology: [
    "What happens to the population over many generations?",
    "How do environmental changes affect the organisms?",
    "Can you identify cause-and-effect relationships?",
    "What role does randomness play in the outcomes?",
  ],
  Math: [
    "What pattern do you see in the numbers or graph?",
    "How does changing one value affect the result?",
    "Can you find a rule that explains the relationship?",
    "What happens when you use negative or zero values?",
  ],
};

// ── Difficulty-scaled experiment suggestions ──

const experimentsByDifficulty: Record<string, string[]> = {
  beginner: [
    "Change one slider at a time and observe the result",
    "Reset the simulation and try a completely different setup",
    "Compare two extreme settings side by side",
  ],
  intermediate: [
    "Form a hypothesis, then test it by adjusting variables",
    "Record three data points and look for a pattern",
    "Try to find the setting that produces the maximum effect",
    "Explain your findings to a classmate in your own words",
  ],
  advanced: [
    "Design a controlled experiment with one independent variable",
    "Collect data and create a graph of input vs. output",
    "Write a mathematical relationship for what you observed",
    "Compare the simulation results to real-world values",
    "Identify the limitations of this simulation model",
  ],
};

// ── Tag-based learning goals ──────────────────

function goalsFromTags(tags: string[]): string[] {
  const goals: string[] = [];

  const tagGoals: Record<string, string> = {
    motion: "Describe different types of motion using proper vocabulary",
    forces: "Explain how forces cause changes in motion",
    energy: "Identify energy transformations and conservation",
    waves: "Describe wave properties: frequency, amplitude, wavelength",
    electricity: "Explain the relationship between voltage, current, and resistance",
    circuits: "Build and analyze simple circuits",
    gravity: "Explain how gravity depends on mass and distance",
    atoms: "Describe the structure of an atom",
    molecules: "Explain how molecular structure affects properties",
    reactions: "Balance and interpret chemical equations",
    acids: "Classify substances as acidic, basic, or neutral",
    evolution: "Explain natural selection and adaptation",
    genetics: "Describe how genes control traits",
    graphing: "Read and interpret graphs accurately",
    fractions: "Compare and operate with fractions",
    algebra: "Solve equations using algebraic reasoning",
    geometry: "Analyze shapes and spatial relationships",
    probability: "Predict outcomes using probability",
    ratios: "Use ratios and proportional reasoning",
    vectors: "Add and decompose vectors",
    trigonometry: "Apply trigonometric functions to real problems",
    optics: "Explain reflection, refraction, and image formation",
    magnetism: "Describe magnetic fields and electromagnetic induction",
    pressure: "Explain how pressure depends on force and area",
    density: "Calculate and compare density of materials",
    buoyancy: "Predict whether objects float or sink",
    "gas-laws": "Relate pressure, volume, and temperature of gases",
  };

  for (const tag of tags) {
    if (tagGoals[tag]) goals.push(tagGoals[tag]);
    if (goals.length >= 4) break;
  }

  // Always include at least one generic goal
  if (goals.length === 0) {
    goals.push("Identify the key variables and how they interact");
  }

  return goals;
}

// ── Main generator ────────────────────────────

export function generateLearningContent(sim: Simulation): LearningContent {
  const observations = observationsBySubject[sim.subject] ?? observationsBySubject.Physics;
  const experiments = experimentsByDifficulty[sim.difficulty] ?? experimentsByDifficulty.beginner;
  const learningGoals = goalsFromTags(sim.tags);

  return {
    conceptSummary: sim.description,
    observations,
    experiments,
    learningGoals,
  };
}
