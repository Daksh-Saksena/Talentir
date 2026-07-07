// ──────────────────────────────────────────────
// Simulation Registry
// ~65 real PhET HTML5 simulations across
// Physics, Chemistry, Biology, and Math.
// ──────────────────────────────────────────────

import type { Simulation, Subject, Difficulty, Grade } from "@/types/simulation";

// Helper to reduce boilerplate for PhET sims
function phet(
  id: string,
  title: string,
  subject: Subject,
  description: string,
  difficulty: Difficulty,
  grades: Grade[],
  tags: string[]
): Simulation {
  return {
    id,
    title,
    subject,
    description,
    provider: "phet",
    difficulty,
    grades,
    tags,
    url: `https://phet.colorado.edu/sims/html/${id}/latest/${id}_en.html`,
    imageUrl: `https://phet.colorado.edu/sims/html/${id}/latest/${id}-600.png`,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  PHYSICS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const physics: Simulation[] = [
  phet(
    "forces-and-motion-basics",
    "Forces and Motion: Basics",
    "Physics",
    "Explore the forces at work when pulling against a cart and pushing a refrigerator, crate, or person. Create an applied force and see how it makes objects move.",
    "beginner",
    ["3-5", "6-8"],
    ["forces", "motion", "friction", "newton"]
  ),
  phet(
    "friction",
    "Friction",
    "Physics",
    "Learn how friction slows down moving objects. Rub two surfaces together and explore what affects friction at the molecular level.",
    "beginner",
    ["3-5", "6-8"],
    ["friction", "forces", "motion", "heat"]
  ),
  phet(
    "john-travoltage",
    "John Travoltage",
    "Physics",
    "Make sparks fly! Rub John's foot on the carpet and touch the doorknob to explore static electricity and charge transfer.",
    "beginner",
    ["3-5", "6-8"],
    ["electricity", "static", "charges", "electrons"]
  ),
  phet(
    "color-vision",
    "Color Vision",
    "Physics",
    "Explore how colored light mixes to make other colors. Adjust the intensity of red, green, and blue spotlights.",
    "beginner",
    ["6-8"],
    ["light", "color", "optics", "waves"]
  ),
  phet(
    "energy-skate-park-basics",
    "Energy Skate Park: Basics",
    "Physics",
    "Learn about conservation of energy by building tracks and observing kinetic and potential energy as a skater moves.",
    "beginner",
    ["6-8", "9-12"],
    ["energy", "kinetic", "potential", "conservation"]
  ),
  phet(
    "gravity-force-lab",
    "Gravity Force Lab",
    "Physics",
    "Visualize the gravitational force between two objects. Change mass and distance to see how the force of gravity changes.",
    "beginner",
    ["6-8", "9-12"],
    ["gravity", "forces", "mass", "newton"]
  ),
  phet(
    "balancing-act",
    "Balancing Act",
    "Physics",
    "Play with objects on a see-saw to learn about balance and torque. Predict how objects of different masses can be used to balance.",
    "beginner",
    ["6-8"],
    ["forces", "torque", "balance", "lever"]
  ),
  phet(
    "density",
    "Density",
    "Physics",
    "Explore how mass and volume relate to density. Compare custom blocks and discover why some objects float while others sink.",
    "beginner",
    ["6-8"],
    ["density", "mass", "volume", "buoyancy"]
  ),
  phet(
    "projectile-motion",
    "Projectile Motion",
    "Physics",
    "Launch objects at different angles and speeds. Observe how gravity, air resistance, and initial conditions affect the trajectory.",
    "intermediate",
    ["9-12"],
    ["motion", "gravity", "kinematics", "projectile"]
  ),
  phet(
    "gravity-and-orbits",
    "Gravity and Orbits",
    "Physics",
    "Explore how gravity controls the motion of our solar system. Change the mass of the sun or planet and watch how orbits change.",
    "intermediate",
    ["6-8", "9-12"],
    ["gravity", "orbits", "space", "kepler"]
  ),
  phet(
    "waves-intro",
    "Waves Intro",
    "Physics",
    "Explore the wonderful world of waves! Observe a string, water, or sound wave and adjust frequency, amplitude, and damping.",
    "intermediate",
    ["6-8", "9-12"],
    ["waves", "frequency", "amplitude", "sound"]
  ),
  phet(
    "wave-on-a-string",
    "Wave on a String",
    "Physics",
    "Create waves on a string by shaking one end. Explore amplitude, frequency, damping, and tension as wave properties.",
    "intermediate",
    ["9-12"],
    ["waves", "frequency", "amplitude", "oscillation"]
  ),
  phet(
    "pendulum-lab",
    "Pendulum Lab",
    "Physics",
    "Play with one or two pendulums and discover how the period depends on length, mass, angle, and gravity.",
    "intermediate",
    ["9-12"],
    ["motion", "pendulum", "gravity", "oscillation"]
  ),
  phet(
    "masses-and-springs",
    "Masses and Springs",
    "Physics",
    "Hang masses from springs and adjust the spring constant and damping. Explore Hooke's law and simple harmonic motion.",
    "intermediate",
    ["9-12"],
    ["forces", "springs", "oscillation", "energy"]
  ),
  phet(
    "hookes-law",
    "Hooke's Law",
    "Physics",
    "Stretch and compress springs to explore the relationship between force and displacement. Discover Hooke's law.",
    "intermediate",
    ["9-12"],
    ["forces", "springs", "elasticity", "hooke"]
  ),
  phet(
    "ohms-law",
    "Ohm's Law",
    "Physics",
    "See how voltage, current, and resistance relate to each other. Adjust the sliders and watch the equation update.",
    "intermediate",
    ["9-12"],
    ["electricity", "circuits", "voltage", "resistance"]
  ),
  phet(
    "circuit-construction-kit-dc",
    "Circuit Construction Kit: DC",
    "Physics",
    "Build circuits with batteries, resistors, light bulbs, and switches. Explore Ohm's Law and circuit behavior.",
    "intermediate",
    ["6-8", "9-12"],
    ["electricity", "circuits", "voltage", "resistance"]
  ),
  phet(
    "resistance-in-a-wire",
    "Resistance in a Wire",
    "Physics",
    "Learn how resistance depends on resistivity, length, and cross-sectional area of a wire.",
    "intermediate",
    ["9-12"],
    ["electricity", "resistance", "circuits", "conductors"]
  ),
  phet(
    "energy-forms-and-changes",
    "Energy Forms and Changes",
    "Physics",
    "Explore how heating and cooling iron, brick, and water transfers energy. See how energy is conserved and converted.",
    "intermediate",
    ["6-8", "9-12"],
    ["energy", "heat", "thermal", "conservation"]
  ),
  phet(
    "gas-properties",
    "Gas Properties",
    "Physics",
    "Pump gas molecules into a box and see what happens as you change volume, temperature, and the number of molecules.",
    "intermediate",
    ["9-12"],
    ["gas-laws", "pressure", "temperature", "molecules"]
  ),
  phet(
    "under-pressure",
    "Under Pressure",
    "Physics",
    "Explore pressure under and above water. Discover how pressure changes with depth and fluid density.",
    "intermediate",
    ["6-8", "9-12"],
    ["pressure", "fluids", "density", "depth"]
  ),
  phet(
    "buoyancy",
    "Buoyancy",
    "Physics",
    "Discover why some objects float and others sink. Explore how mass, volume, and fluid density determine buoyancy.",
    "intermediate",
    ["6-8", "9-12"],
    ["buoyancy", "density", "fluids", "forces"]
  ),
  phet(
    "my-solar-system",
    "My Solar System",
    "Physics",
    "Build your own solar system! Set masses, positions, and velocities of celestial bodies and observe orbital dynamics.",
    "intermediate",
    ["9-12"],
    ["gravity", "orbits", "space", "kepler"]
  ),
  phet(
    "geometric-optics",
    "Geometric Optics",
    "Physics",
    "Explore how lenses and mirrors form images. Discover focal length, magnification, and ray diagrams.",
    "intermediate",
    ["9-12"],
    ["optics", "lenses", "light", "reflection"]
  ),
  phet(
    "bending-light",
    "Bending Light",
    "Physics",
    "Explore refraction and reflection of light between different media. Measure the angle and see total internal reflection.",
    "advanced",
    ["9-12", "College"],
    ["optics", "refraction", "light", "snell"]
  ),
  phet(
    "faradays-law",
    "Faraday's Law",
    "Physics",
    "Move a magnet through a coil and observe the induced current. Explore electromagnetic induction and Faraday's law.",
    "advanced",
    ["9-12", "College"],
    ["magnetism", "electricity", "induction", "emf"]
  ),
  phet(
    "charges-and-fields",
    "Charges and Fields",
    "Physics",
    "Place positive and negative charges to see the electric field and potential. Explore equipotential lines and field vectors.",
    "advanced",
    ["9-12", "College"],
    ["electricity", "charges", "fields", "coulomb"]
  ),
  phet(
    "capacitor-lab-basics",
    "Capacitor Lab: Basics",
    "Physics",
    "Explore how a capacitor works. Change plate area, separation, and dielectric to see how capacitance and stored energy change.",
    "advanced",
    ["9-12", "College"],
    ["electricity", "capacitor", "circuits", "energy"]
  ),
  phet(
    "coulombs-law",
    "Coulomb's Law",
    "Physics",
    "Visualize the electrostatic force between two charges. Change the magnitude and sign of charges and observe the force.",
    "advanced",
    ["9-12", "College"],
    ["electricity", "charges", "coulomb", "forces"]
  ),
  phet(
    "wave-interference",
    "Wave Interference",
    "Physics",
    "Create waves with two sources and observe interference patterns. Explore constructive and destructive interference.",
    "advanced",
    ["9-12", "College"],
    ["waves", "interference", "diffraction", "light"]
  ),
  phet(
    "blackbody-spectrum",
    "Blackbody Spectrum",
    "Physics",
    "Observe how the spectrum of a blackbody changes with temperature. Compare the Sun, a light bulb, and the Earth.",
    "advanced",
    ["College"],
    ["light", "spectrum", "temperature", "radiation"]
  ),
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CHEMISTRY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const chemistry: Simulation[] = [
  phet(
    "build-an-atom",
    "Build an Atom",
    "Chemistry",
    "Build an atom out of protons, neutrons, and electrons, and see how the element, charge, and mass change.",
    "beginner",
    ["6-8", "9-12"],
    ["atoms", "elements", "protons", "electrons"]
  ),
  phet(
    "states-of-matter",
    "States of Matter",
    "Chemistry",
    "Watch atoms and molecules in motion as you heat, cool, and change the state between solid, liquid, and gas.",
    "beginner",
    ["6-8", "9-12"],
    ["atoms", "molecules", "states", "temperature"]
  ),
  phet(
    "isotopes-and-atomic-mass",
    "Isotopes and Atomic Mass",
    "Chemistry",
    "Discover how isotopes differ and why average atomic mass is not always a whole number. Build and compare isotopes.",
    "intermediate",
    ["9-12"],
    ["atoms", "isotopes", "mass", "elements"]
  ),
  phet(
    "ph-scale",
    "pH Scale",
    "Chemistry",
    "Test the pH of everyday liquids like coffee, spit, and soap. Discover if a solution is acidic, basic, or neutral.",
    "intermediate",
    ["6-8", "9-12"],
    ["acids", "bases", "pH", "solutions"]
  ),
  phet(
    "balancing-chemical-equations",
    "Balancing Chemical Equations",
    "Chemistry",
    "Balance chemical equations by adjusting coefficients. Make sure the same number of atoms exist on both sides.",
    "intermediate",
    ["9-12"],
    ["reactions", "equations", "stoichiometry", "atoms"]
  ),
  phet(
    "reactants-products-and-leftovers",
    "Reactants, Products and Leftovers",
    "Chemistry",
    "Create products from reactants and figure out what's left over. Relate quantities to balanced chemical equations.",
    "intermediate",
    ["9-12"],
    ["reactions", "stoichiometry", "molecules", "limiting"]
  ),
  phet(
    "concentration",
    "Concentration",
    "Chemistry",
    "Watch how concentration changes as you add solute, change volume, or evaporate solvent from a solution.",
    "intermediate",
    ["9-12"],
    ["solutions", "concentration", "molarity", "dissolving"]
  ),
  phet(
    "molecule-shapes",
    "Molecule Shapes",
    "Chemistry",
    "Explore molecule shapes by building molecules in 3D. Discover how electron pairs determine molecular geometry.",
    "intermediate",
    ["9-12"],
    ["molecules", "geometry", "VSEPR", "bonds"]
  ),
  phet(
    "molarity",
    "Molarity",
    "Chemistry",
    "Precisely determine the concentration of a solution in moles per liter. Explore how solute and volume affect molarity.",
    "advanced",
    ["9-12", "College"],
    ["solutions", "molarity", "concentration", "moles"]
  ),
  phet(
    "molecule-polarity",
    "Molecule Polarity",
    "Chemistry",
    "Explore how molecular structure and electronegativity determine whether a molecule is polar or nonpolar.",
    "advanced",
    ["9-12", "College"],
    ["molecules", "polarity", "electronegativity", "bonds"]
  ),
  phet(
    "acid-base-solutions",
    "Acid-Base Solutions",
    "Chemistry",
    "Investigate the properties of acids and bases. Test strength, concentration, pH, and conductivity.",
    "advanced",
    ["9-12", "College"],
    ["acids", "bases", "pH", "electrolytes"]
  ),
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BIOLOGY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const biology: Simulation[] = [
  phet(
    "natural-selection",
    "Natural Selection",
    "Biology",
    "Explore natural selection by controlling the environment and seeing how a population of bunnies evolves over time.",
    "intermediate",
    ["9-12"],
    ["evolution", "genetics", "adaptation", "population"]
  ),
  phet(
    "gene-expression-essentials",
    "Gene Expression Essentials",
    "Biology",
    "Watch a gene get transcribed and translated. See how mRNA carries the code from DNA to make a protein.",
    "advanced",
    ["9-12", "College"],
    ["genetics", "DNA", "RNA", "protein"]
  ),
  phet(
    "neuron",
    "Neuron",
    "Biology",
    "Stimulate a neuron and monitor what happens. Observe an action potential traveling down the axon in real time.",
    "advanced",
    ["9-12", "College"],
    ["neuroscience", "neurons", "action-potential", "biology"]
  ),
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MATH
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const math: Simulation[] = [
  phet(
    "make-a-ten",
    "Make a Ten",
    "Math",
    "Use number bonds to break apart numbers and make a ten. A foundational strategy for addition.",
    "beginner",
    ["K-2"],
    ["addition", "numbers", "arithmetic", "counting"]
  ),
  phet(
    "arithmetic",
    "Arithmetic",
    "Math",
    "Practice multiplication, division, and factoring. Build fluency with basic math facts in a game-like environment.",
    "beginner",
    ["3-5"],
    ["arithmetic", "multiplication", "division", "factors"]
  ),
  phet(
    "fractions-intro",
    "Fractions: Intro",
    "Math",
    "Build fractions from shapes and number lines. Explore equivalent fractions and compare fractional amounts.",
    "beginner",
    ["3-5"],
    ["fractions", "numbers", "equivalence", "comparison"]
  ),
  phet(
    "fraction-matcher",
    "Fraction Matcher",
    "Math",
    "Match fractions using different visual representations. Build understanding of fraction equivalence.",
    "beginner",
    ["3-5", "6-8"],
    ["fractions", "equivalence", "matching", "comparison"]
  ),
  phet(
    "area-builder",
    "Area Builder",
    "Math",
    "Build shapes and explore the concept of area. Find the area of different shapes by counting unit squares.",
    "beginner",
    ["3-5"],
    ["geometry", "area", "shapes", "measurement"]
  ),
  phet(
    "number-line-integers",
    "Number Line: Integers",
    "Math",
    "Explore integers on a number line. Compare values, find absolute values, and understand negative numbers.",
    "beginner",
    ["6-8"],
    ["integers", "numbers", "negative", "number-line"]
  ),
  phet(
    "number-line-operations",
    "Number Line: Operations",
    "Math",
    "Use the number line to model addition and subtraction of integers. Visualize operations as movements.",
    "beginner",
    ["6-8"],
    ["integers", "addition", "subtraction", "number-line"]
  ),
  phet(
    "number-line-distance",
    "Number Line: Distance",
    "Math",
    "Explore the concept of distance between points on a number line. Relate distance to absolute value.",
    "beginner",
    ["6-8"],
    ["integers", "distance", "absolute-value", "number-line"]
  ),
  phet(
    "equality-explorer",
    "Equality Explorer",
    "Math",
    "Explore what it means for two expressions to be equal. Use a balance to solve equations visually.",
    "intermediate",
    ["6-8"],
    ["algebra", "equations", "equality", "balance"]
  ),
  phet(
    "expression-exchange",
    "Expression Exchange",
    "Math",
    "Exchange coins and variables to explore equivalent algebraic expressions. Simplify and compare expressions.",
    "intermediate",
    ["6-8"],
    ["algebra", "expressions", "variables", "simplification"]
  ),
  phet(
    "unit-rates",
    "Unit Rates",
    "Math",
    "Compare unit rates by shopping for fruits, adjusting recipes, and racing cars. Understand proportional reasoning.",
    "intermediate",
    ["6-8"],
    ["ratios", "rates", "proportional", "comparison"]
  ),
  phet(
    "proportion-playground",
    "Proportion Playground",
    "Math",
    "Explore proportions using paint, necklaces, and billiards. See how ratios stay the same as quantities change.",
    "intermediate",
    ["6-8"],
    ["ratios", "proportional", "scaling", "fractions"]
  ),
  phet(
    "ratio-and-proportion",
    "Ratio and Proportion",
    "Math",
    "Explore the meaning of ratio and see proportional relationships in action with interactive challenges.",
    "intermediate",
    ["6-8"],
    ["ratios", "proportional", "equivalence", "comparison"]
  ),
  phet(
    "function-builder",
    "Function Builder",
    "Math",
    "Build functions by chaining operations together. See how input and output are related through function machines.",
    "intermediate",
    ["6-8", "9-12"],
    ["algebra", "functions", "input-output", "patterns"]
  ),
  phet(
    "graphing-lines",
    "Graphing Lines",
    "Math",
    "Explore the world of lines. Investigate slope, intercept, and different forms of linear equations.",
    "intermediate",
    ["6-8", "9-12"],
    ["graphing", "algebra", "slope", "linear"]
  ),
  phet(
    "graphing-slope-intercept",
    "Graphing Slope-Intercept",
    "Math",
    "Graph a line using slope-intercept form (y = mx + b). Adjust slope and intercept to match target lines.",
    "intermediate",
    ["6-8", "9-12"],
    ["graphing", "algebra", "slope", "intercept"]
  ),
  phet(
    "graphing-quadratics",
    "Graphing Quadratics",
    "Math",
    "Explore the graphs of quadratic functions. Change coefficients and see how the parabola moves and stretches.",
    "advanced",
    ["9-12"],
    ["graphing", "algebra", "quadratic", "parabola"]
  ),
  phet(
    "vector-addition",
    "Vector Addition",
    "Math",
    "Explore vectors in 1D and 2D. Add vectors graphically and with components. Decompose vectors into x and y parts.",
    "advanced",
    ["9-12", "College"],
    ["vectors", "addition", "components", "trigonometry"]
  ),
  phet(
    "trig-tour",
    "Trig Tour",
    "Math",
    "Take a tour of trigonometry using the unit circle. See how sin, cos, and tan relate to angle and the circle.",
    "advanced",
    ["9-12", "College"],
    ["trigonometry", "angles", "unit-circle", "functions"]
  ),
  phet(
    "plinko-probability",
    "Plinko Probability",
    "Math",
    "Drop balls through a Plinko board and explore the binomial distribution. Predict where balls will land.",
    "advanced",
    ["9-12"],
    ["probability", "statistics", "distribution", "random"]
  ),
  phet(
    "curve-fitting",
    "Curve Fitting",
    "Math",
    "Drag data points and fit curves of different orders. Explore goodness of fit and residuals.",
    "advanced",
    ["9-12", "College"],
    ["graphing", "statistics", "regression", "data"]
  ),
  phet(
    "least-squares-regression",
    "Least-Squares Regression",
    "Math",
    "Explore correlations and fit lines to data using the least-squares method. Analyze real and custom data sets.",
    "advanced",
    ["9-12", "College"],
    ["graphing", "statistics", "regression", "correlation"]
  ),
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  COMBINED REGISTRY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const simulations: Simulation[] = [
  ...physics,
  ...chemistry,
  ...biology,
  ...math,
];

export default simulations;
