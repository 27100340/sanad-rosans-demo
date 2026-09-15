/**
 * Scripted physics coaching, one script per 9702 strand.
 *
 * This is what Physics Studio answers with when no model is reachable, which is
 * the normal state of this demo. Sanad's rule is that every AI feature has a
 * deterministic fallback, and for a teaching product that fallback has to be
 * worth reading, so each script is real A-Level method rather than an apology.
 *
 * `detectTopic` lets a student ask without choosing a strand first, mirroring
 * the reference's "Any / not sure" option.
 */
import type { GuidedAnswer, HelpMode } from "@/lib/domain/physics";
import { ALL_TOPICS, formulaeFor } from "./topics";

export interface TopicScript {
  /** The one idea the strand turns on. */
  principle: string;
  /** The method, in the order a student should carry it out. */
  method: string[];
  /** The mistake this strand is famous for. */
  pitfall: string;
  /** A question put back to the student. */
  check: string;
}

export const TOPIC_SCRIPTS: Record<string, TopicScript> = {
  "Physical quantities & units": {
    principle: "Every physical quantity is a number, a unit and an uncertainty. Homogeneity checks an equation before the numbers ever do.",
    method: [
      "Write down the quantity you want and the equation that defines it.",
      "Substitute base units for every symbol and simplify: N becomes kg m s⁻², J becomes kg m² s⁻².",
      "If both sides reduce to the same base units the equation is homogeneous; if they do not, the equation is wrong.",
      "Combine uncertainties: add percentage uncertainties for a product or quotient, and multiply by the power for an index.",
    ],
    pitfall: "Treating homogeneity as proof. A homogeneous equation can still carry a wrong dimensionless constant, so it shows an equation could be right, never that it is.",
    check: "What are the base units of each side, and what is the percentage uncertainty in your final value?",
  },
  Kinematics: {
    principle: "The suvat equations hold only while the acceleration is constant. On a graph the physics lives in the gradient and the area.",
    method: [
      "List s, u, v, a and t, mark the one you want, and mark the one you neither have nor want.",
      "Choose the suvat equation that leaves that unwanted quantity out.",
      "For a projectile, split into horizontal (a = 0) and vertical (a = g) motion and let them share only the time.",
      "On a graph read the gradient for a rate and the area for an accumulation, and keep the sign.",
    ],
    pitfall: "Carrying a suvat equation through a change in acceleration, or mixing the horizontal and vertical components of a projectile.",
    check: "Is the acceleration genuinely constant over the whole interval you applied that equation to?",
  },
  Dynamics: {
    principle: "Newton's second law is really about momentum: F = Δp/Δt. Momentum is conserved in every collision; kinetic energy is not.",
    method: [
      "Choose a positive direction and give every velocity its sign.",
      "Write total momentum before equals total momentum after.",
      "For a force, use F = Δp/Δt, which copes with changing mass as well as changing velocity.",
      "Test elasticity by comparing total kinetic energy before and after, or relative speed of approach against relative speed of separation.",
    ],
    pitfall: "Assuming kinetic energy is conserved. Only a perfectly elastic collision conserves it; momentum is conserved either way.",
    check: "Which direction did you call positive, and did every velocity in your equation get that convention?",
  },
  "Forces, density & pressure": {
    principle: "A body in equilibrium has zero resultant force and zero resultant moment about any point you care to choose.",
    method: [
      "Draw the body on its own and mark every force with its line of action.",
      "Resolve into two perpendicular directions and set each resultant to zero.",
      "Take moments about a point that removes an unknown, then set clockwise equal to anticlockwise.",
      "In a fluid, use p = ρgh for the column and upthrust equals the weight of fluid displaced.",
    ],
    pitfall: "Forgetting that the weight of a uniform body acts at its centre of gravity, so it has a moment about every other point.",
    check: "About which point did you take moments, and does your force diagram close?",
  },
  "Work, energy & power": {
    principle: "Work is the component of force along the displacement. Energy is conserved; efficiency measures how much of it stayed useful.",
    method: [
      "Name the store the energy starts in and the store it ends in.",
      "Use W = Fs cos θ, remembering that a force perpendicular to the motion does no work at all.",
      "For power use P = W/t, or P = Fv when force and speed are both steady.",
      "Efficiency is useful output over total input; whatever is missing went to internal energy and sound.",
    ],
    pitfall: "Using the whole force instead of its component along the displacement, or writing that energy was lost rather than transferred.",
    check: "Does your efficiency come out below 100%, and can you say where the rest of the energy went?",
  },
  "Deformation of solids": {
    principle: "Hooke's law describes this sample; the Young modulus describes the material it is made of.",
    method: [
      "Decide whether the question is about this spring (F = kx) or this material (E = stress / strain).",
      "Stress is F/A using the cross-sectional area; strain is extension over original length.",
      "Strain has no unit. Stress and the Young modulus are both in pascals.",
      "Elastic strain energy is the area under the force-extension graph, which is ½Fx while Hooke's law holds.",
    ],
    pitfall: "Leaving the area in mm² or the length in cm. Convert to m² and m before you substitute anything.",
    check: "Is your strain dimensionless, and is the sample still below its limit of proportionality?",
  },
  Waves: {
    principle: "v = fλ everywhere. The medium fixes the speed; the source fixes the frequency.",
    method: [
      "Write down which two of v, f and λ the question gives you.",
      "Keep frequency in Hz, wavelength in m and speed in m s⁻¹ before substituting.",
      "At a boundary the frequency never changes; the speed and the wavelength both do.",
      "Intensity is power per unit area and goes as the square of the amplitude.",
    ],
    pitfall: "Assuming a higher frequency travels faster, or halving both the time and the distance in an echo question.",
    check: "Which quantity stays fixed when this wave crosses into a new medium?",
  },
  Superposition: {
    principle: "Coherent waves meeting add displacement to displacement. The path difference decides constructive or destructive.",
    method: [
      "Check the sources are coherent: the same frequency and a constant phase relation.",
      "Constructive where the path difference is a whole number of wavelengths; destructive where it is an odd number of half wavelengths.",
      "Double slits: λ = ax/D. Diffraction grating: d sin θ = nλ.",
      "On a stationary wave, adjacent nodes are half a wavelength apart, and every point between two nodes is in phase.",
    ],
    pitfall: "Confusing the slit separation a with the fringe spacing x, or using the small-angle approximation on a grating where the angles are large.",
    check: "What is the path difference at the point you are considering, measured in wavelengths?",
  },
  Electricity: {
    principle: "Current is charge per second, potential difference is energy per coulomb, and resistance is the ratio of the two.",
    method: [
      "Pick the level the question is asking at: I = Q/t for the circuit, I = nAvq for the charge carriers.",
      "Use V = W/Q for energy per unit charge, not for total energy.",
      "Apply R = V/I, and R = ρL/A when the geometry of the conductor is what changes.",
      "For a non-ohmic component, read V/I at the point you need rather than taking a gradient.",
    ],
    pitfall: "Taking the gradient of an I-V curve as the resistance. Resistance at a point is V/I there, not the slope.",
    check: "Is this component ohmic over the range you used, and did you read V and I at the same point?",
  },
  "D.C. circuits": {
    principle: "Kirchhoff's two laws are charge conservation and energy conservation. Series shares the current; parallel shares the potential difference.",
    method: [
      "Mark which components are in series and which are in parallel before any arithmetic.",
      "Junction rule: current in equals current out. Loop rule: the e.m.f.s round a loop equal the sum of the p.d.s.",
      "Combine resistances: add them in series, add their reciprocals in parallel.",
      "For a real cell use V = ε − Ir; for a divider use Vout = Vin R₂/(R₁ + R₂).",
    ],
    pitfall: "Adding parallel resistances. The combination is always smaller than the smallest branch — use that as your sanity check.",
    check: "Is your parallel combination smaller than the smallest single resistor in it?",
  },
  "Particle physics": {
    principle: "Quarks build hadrons; leptons are fundamental. Charge, lepton number and baryon number balance in every interaction.",
    method: [
      "Write the quark composition: a proton is uud, a neutron is udd.",
      "Add the quark charges in thirds and confirm the charge of the hadron.",
      "In beta-minus decay one down quark becomes an up quark, emitting an electron and an electron antineutrino.",
      "Balance charge, lepton number and baryon number on both sides of the equation.",
    ],
    pitfall: "Leaving the neutrino out. Lepton number will not balance without it, and that is a mark on its own.",
    check: "Do charge, lepton number and baryon number each balance across your equation?",
  },
  "Circular motion": {
    principle: "Circular motion needs a resultant force toward the centre. Name the real force providing it before any arithmetic.",
    method: [
      "Say which real force is acting as the centripetal force: gravity, tension, friction, the normal contact force, or a combination.",
      "Get the angular quantities consistent: ω = 2π/T and v = rω.",
      "Apply F = mv²/r, which is the same as mrω².",
      "At the top or bottom of a loop, add the radial components with the correct signs before equating.",
    ],
    pitfall: "Drawing 'centripetal force' on the diagram as an extra arrow. It is the name of the resultant, not a new force.",
    check: "Which named force is providing the centripetal force here, and does it point at the centre?",
  },
  "Gravitational fields": {
    principle: "Field strength is force per unit mass; potential is energy per unit mass and is always negative.",
    method: [
      "Treat a uniform sphere as a point mass at its centre.",
      "Use g = GM/r² for the field and φ = −GM/r for the potential, and note the different powers of r.",
      "For an orbit, set gravity equal to the centripetal force, then eliminate v using v = 2πr/T.",
      "Energy changes use ΔEₚ = mΔφ, and φ rises toward zero as r grows.",
    ],
    pitfall: "Dropping the minus sign on potential, or using height above the surface where the formula wants distance from the centre.",
    check: "Is your r measured from the centre of the mass, and did your potential come out negative?",
  },
  "Thermal physics": {
    principle: "Temperature measures mean kinetic energy. Latent heat changes potential energy instead, so the thermometer does not move.",
    method: [
      "Decide whether the substance is changing temperature or changing state; it cannot do both at once.",
      "Changing temperature: Q = mcΔθ, with Δθ a difference you subtract.",
      "Changing state: Q = mL, at constant temperature.",
      "For the first law, ΔU = q + w, and state your sign convention for work done on or by the gas.",
    ],
    pitfall: "Substituting the final temperature rather than the temperature change into Q = mcΔθ.",
    check: "Is your Δθ a subtraction, and which stage of the heating curve are you on?",
  },
  "Ideal gases": {
    principle: "pV = nRT describes the gas from outside; pV = ⅓Nm⟨c²⟩ derives the same thing from molecules bouncing off the walls.",
    method: [
      "Convert every temperature to kelvin before anything else happens.",
      "Choose the form you need: pV = nRT in moles, or pV = NkT in molecules.",
      "For a change at fixed mass, use p₁V₁/T₁ = p₂V₂/T₂.",
      "For the kinetic model, link ½m⟨c²⟩ = (3/2)kT to get the mean kinetic energy per molecule.",
    ],
    pitfall: "Leaving a temperature in degrees Celsius. Every gas law needs kelvin, and a ratio in Celsius is meaningless.",
    check: "Are all your temperatures in kelvin, and is the mass of gas actually fixed?",
  },
  Oscillations: {
    principle: "Simple harmonic motion is defined by a = −ω²x: acceleration proportional to displacement and directed back toward equilibrium.",
    method: [
      "Confirm the defining condition holds before reaching for any SHM formula.",
      "Find ω from the period or frequency: ω = 2π/T = 2πf.",
      "Use x = x₀ sin ωt or x₀ cos ωt depending on where the motion starts.",
      "Energy: the total is ½mω²x₀², all kinetic at the centre and all potential at the extremes.",
    ],
    pitfall: "Quoting 'acceleration proportional to displacement' without the minus sign. The direction back toward equilibrium is half the definition.",
    check: "Does the motion satisfy a = −ω²x, and where in the cycle is t = 0 for you?",
  },
  "Electric fields": {
    principle: "Field strength is force per unit charge: uniform between parallel plates, inverse-square around a point charge.",
    method: [
      "Decide which geometry applies: E = V/d between plates, or E = Q/(4πε₀r²) for a point charge.",
      "Keep the sign of every charge; the force on a negative charge opposes the field.",
      "A charged particle crossing a uniform field behaves like a projectile: uniform acceleration along the field, constant velocity across it.",
      "Work done moving a charge through a potential difference is W = qΔV.",
    ],
    pitfall: "Mixing the uniform-field and radial-field formulae, or quietly dropping the sign of a negative charge.",
    check: "Is the field uniform or radial in this question, and which way does the force on this charge point?",
  },
  Capacitance: {
    principle: "A capacitor stores charge at a potential difference, and the energy stored is the area under the Q-V graph.",
    method: [
      "Start from the definition C = Q/V.",
      "Combine capacitors the opposite way round to resistors: add in parallel, add reciprocals in series.",
      "Energy stored is ½QV = ½CV² = ½Q²/C; the half is there because V rises as it charges.",
      "For discharge use x = x₀e^(−t/RC), with time constant τ = RC.",
    ],
    pitfall: "Combining capacitors the way you combine resistors. Parallel adds, series adds reciprocals — it is the other way round.",
    check: "Did you combine the capacitors the opposite way round to resistors?",
  },
  "Magnetic fields": {
    principle: "A current in a field feels a force; a changing flux linkage induces an e.m.f. Which one is the cause decides the rule you use.",
    method: [
      "Decide whether current is the cause (motor effect, F = BIL sin θ) or the effect (induction).",
      "For a moving charge use F = BQv sin θ; the force is always perpendicular to the velocity, so the speed never changes.",
      "Flux is Φ = BA cos θ, and flux linkage is NΦ.",
      "Faraday: the induced e.m.f. equals the rate of change of flux linkage. Lenz: the minus sign means it opposes the change that caused it.",
    ],
    pitfall: "Expecting an e.m.f. from a steady field. Only a changing flux linkage induces one.",
    check: "What exactly is changing in this situation, and how quickly?",
  },
  "Alternating currents": {
    principle: "The r.m.s. value is the steady direct current that would dissipate the same mean power in the same resistor.",
    method: [
      "Read carefully whether the value given is a peak or an r.m.s. value; they differ by a factor of √2.",
      "Mean power in a resistor is ½I₀V₀, which is the same as Irms Vrms.",
      "For a rectifier, sketch the output waveform before calculating anything.",
      "For smoothing, a larger RC compared with the period gives less ripple.",
    ],
    pitfall: "Putting peak values into a power calculation. The mean of a symmetrical a.c. is zero, which is exactly why r.m.s. exists.",
    check: "Is the number you substituted the peak value or the r.m.s. value?",
  },
  "Quantum physics": {
    principle: "Light arrives as photons of energy hf, and one photon interacts with one electron. That is why a threshold frequency exists at all.",
    method: [
      "Pick one energy unit and stay in it: 1 eV = 1.60 × 10⁻¹⁹ J.",
      "Photon energy is E = hf = hc/λ.",
      "Photoelectric equation: hf = Φ + ½mv²max, so below f₀ = Φ/h nothing is emitted however bright the light.",
      "For de Broglie, λ = h/p, finding p from the kinetic energy where you need to.",
    ],
    pitfall: "Arguing from intensity. Intensity changes how many photons arrive, never the energy each one carries.",
    check: "Is the photon energy above the work function, and did you keep to one energy unit throughout?",
  },
  "Nuclear physics": {
    principle: "Decay is random and spontaneous. Activity is proportional to the number of undecayed nuclei, which is exactly why decay is exponential.",
    method: [
      "Write the nuclide with nucleon number above and proton number below, then balance both across the equation.",
      "Relate the constants: λ = ln2 / t½.",
      "Use N = N₀e^(−λt), or simply count whole half-lives when the time is a neat multiple.",
      "For energy released, find the mass defect and apply E = mc², keeping consistently to u or to kg.",
    ],
    pitfall: "Dividing the activity by the number of half-lives instead of halving it repeatedly.",
    check: "Do the nucleon and proton numbers balance on both sides, and is your time in the same unit as the half-life?",
  },
  "Astronomy & cosmology": {
    principle: "Luminosity, temperature and radius are tied together by Stefan-Boltzmann; distance and recession speed by Hubble's law.",
    method: [
      "Use L = 4πσr²T⁴ for the luminosity of a star treated as a black body.",
      "Wien's displacement law λmax T = 2.9 × 10⁻³ m K gives the surface temperature from the peak wavelength.",
      "Radiant flux intensity falls as 1/d², so F = L/(4πd²) lets you get the distance.",
      "Redshift gives Δλ/λ ≈ v/c, and then Hubble's law v = H₀d gives the distance.",
    ],
    pitfall: "Forgetting that temperature enters to the fourth power, or confusing luminosity (what the star emits) with flux intensity (what you receive).",
    check: "Are you working with the power the star emits, or the power arriving at your detector?",
  },
};

/** Words that point at a strand when a student asks without choosing one. */
const KEYWORDS: Record<string, string[]> = {
  "Physical quantities & units": ["base unit", "si unit", "homogen", "dimension", "uncertainty", "significant figure", "prefix", "scalar", "vector quantity", "precision", "systematic error"],
  Kinematics: ["velocity", "acceleration", "displacement", "projectile", "suvat", "terminal velocity", "free fall", "velocity-time", "displacement-time", "deceleration"],
  Dynamics: ["momentum", "newton's second", "newton's third", "collision", "elastic collision", "inelastic", "impulse", "recoil", "conservation of momentum"],
  "Forces, density & pressure": ["moment", "torque", "couple", "equilibrium", "centre of gravity", "upthrust", "archimedes", "density", "pressure in a liquid", "hydrostatic"],
  "Work, energy & power": ["work done", "kinetic energy", "potential energy", "efficiency", "power output", "joule", "watt", "conservation of energy"],
  "Deformation of solids": ["hooke", "young modulus", "stress", "strain", "elastic limit", "limit of proportionality", "spring constant", "ductile", "brittle", "strain energy"],
  Waves: ["wavelength", "frequency", "amplitude", "transverse", "longitudinal", "polaris", "doppler", "wave speed", "intensity", "progressive wave"],
  Superposition: ["interference", "double slit", "diffraction grating", "path difference", "coherent", "stationary wave", "node", "antinode", "fringe", "young's slits"],
  Electricity: ["drift velocity", "charge carrier", "resistivity", "i-v characteristic", "ohm's law", "electric current", "coulomb", "electromotive"],
  "D.C. circuits": ["kirchhoff", "potential divider", "internal resistance", "in parallel", "in series", "thermistor", "ammeter", "voltmeter", "circuit"],
  "Particle physics": ["quark", "lepton", "hadron", "baryon", "meson", "neutrino", "antiparticle", "beta decay", "fundamental particle"],
  "Circular motion": ["centripetal", "angular velocity", "circular orbit", "angular speed", "radian", "banked", "conical pendulum", "circular path", "moves in a circle"],
  "Gravitational fields": ["gravitational field", "gravitational potential", "orbit", "satellite", "escape velocity", "kepler", "geostationary", "newton's law of gravitation"],
  "Thermal physics": ["specific heat", "latent heat", "internal energy", "first law of thermodynamics", "thermal equilibrium", "melting", "boiling", "heat capacity", "thermal energy"],
  "Ideal gases": ["ideal gas", "boyle", "kinetic theory", "mole", "avogadro", "gas law", "root mean square speed", "pv = nrt", "molar", "kelvin"],
  Oscillations: ["simple harmonic", "shm", "oscillat", "damping", "damped", "resonance", "pendulum", "amplitude decay", "forced vibration", "natural frequency"],
  "Electric fields": ["electric field", "electric potential", "parallel plates", "point charge", "coulomb's law", "field strength", "equipotential", "charged particle"],
  Capacitance: ["capacitor", "capacitance", "farad", "time constant", "discharge curve", "charge stored", "dielectric", "discharges through a resistor"],
  "Magnetic fields": [
    "magnetic flux", "flux density", "tesla", "electromagnetic induction", "faraday", "lenz", "solenoid", "hall probe", "motor effect", "flux linkage",
    "induced", "induction", "e.m.f", "emf", "coil", "magnet", "dynamo", "generator", "fleming", "right-hand rule", "left-hand rule",
  ],
  "Alternating currents": ["alternating current", "r.m.s", "rms", "peak voltage", "rectif", "smoothing", "a.c. supply", "transformer", "mean power"],
  "Quantum physics": ["photon", "photoelectric", "work function", "threshold frequency", "de broglie", "planck", "energy level", "line spectrum", "electronvolt", "intensity of light"],
  "Nuclear physics": ["radioactiv", "half-life", "half life", "decay constant", "isotope", "binding energy", "mass defect", "fission", "fusion", "nuclide", "activity", "becquerel", "alpha particle", "beta particle", "gamma ray"],
  "Astronomy & cosmology": ["luminosity", "stefan", "wien", "redshift", "hubble", "standard candle", "cosmolog", "galaxy", "parsec", "black body", "expanding universe"],
};

/** Words that mark a question as physics even when no single strand stands out. */
const GENERAL_PHYSICS = [
  "physic", "newton", "joule", "watt", "volt", "ampere", "ohm", "pascal", "hertz", "kelvin", "tesla", "weber",
  "gravit", "motion", "force", "energy", "momentum", "atom", "electron", "proton", "neutron", "nucleus",
  "temperature", "wave", "light", "electric", "magnet", "circuit", "formula", "experiment", "graph", "9702",
];

const QUOTE_CHARS = 90;

/**
 * Whether the question is plausibly physics. Used only when the student has not
 * chosen a strand: a scripted kinematics answer to a history question would be
 * worse than saying the studio only covers physics.
 */
export function looksLikePhysics(question: string): boolean {
  const text = question.toLowerCase();
  if (Object.values(KEYWORDS).some((words) => words.some((w) => text.includes(w)))) return true;
  // Matched at a word start, not anywhere: these are single words and stems, so
  // a plain substring test reads "paragraph" as "graph" and lets an essay
  // request through as physics.
  return GENERAL_PHYSICS.some((w) => new RegExp(`\\b${w}`).test(text));
}

/**
 * Best-matching strand for a free-text question, or null when nothing matched.
 * Matches are scored by the length of the phrase they matched rather than by a
 * bare count, so a specific phrase beats a word several strands share.
 *
 * Returning null matters: guessing a strand for a question that matched nothing
 * would mislabel the answer and, worse, hand the tutor the wrong syllabus
 * context. The caller asks the model to name the strand instead.
 */
export function matchTopic(question: string): string | null {
  const text = question.toLowerCase();
  let best: string | null = null;
  let bestScore = 0;
  for (const topic of ALL_TOPICS) {
    const words = KEYWORDS[topic] ?? [];
    const score = words.filter((w) => text.includes(w)).reduce((sum, w) => sum + w.length, 0);
    if (score > bestScore) {
      best = topic;
      bestScore = score;
    }
  }
  return best;
}

/** The same, with a default for the scripted path, which must always produce something. */
export function detectTopic(question: string): string {
  return matchTopic(question) ?? "Kinematics";
}

/** Quotes the student's question back without cutting a word in half. */
function shortQuote(question: string): string {
  const text = question.trim().replace(/\s+/g, " ");
  if (text.length <= QUOTE_CHARS) return text;
  const cut = text.slice(0, QUOTE_CHARS);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > QUOTE_CHARS / 2 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:]$/, "")}…`;
}

/**
 * The scripted guided answer. The help mode changes what the student is shown:
 * a hint stops after the first two steps, a worked example gives the full method
 * and hands the question back, and examiner style frames the same method as the
 * mark points it would earn.
 */
export function scriptedAnswer(topic: string, mode: HelpMode, question: string): GuidedAnswer {
  const script = TOPIC_SCRIPTS[topic] ?? TOPIC_SCRIPTS.Kinematics;
  const formula = formulaeFor(topic)[0];

  if (mode === "hint") {
    return {
      idea: script.principle,
      steps: [
        ...script.method.slice(0, 2),
        formula ? `Start from ${formula} and write down what each symbol stands for in your question.` : "Write down what each symbol in your equation stands for in this question.",
        "Now take the next line yourself. Paste your working back here and I will tell you whether the step is sound, without finishing it for you.",
      ],
      pitfall: script.pitfall,
      check: script.check,
    };
  }

  if (mode === "worked-example") {
    return {
      idea: script.principle,
      steps: [
        ...script.method,
        formula ? `Run it once on your own numbers: substitute into ${formula}, keep the units alongside the numbers, and simplify.` : "Now substitute your own numbers into the same method.",
        "That is the method in full on a question of this shape. Take your own numbers through the same lines and check the unit of the final answer.",
      ],
      pitfall: script.pitfall,
      check: script.check,
    };
  }

  return {
    idea: `${script.principle} An examiner is marking the reasoning here, not just the final number.`,
    steps: [
      `M1 — method: ${script.method[0]}`,
      `M1 — working: ${script.method[1] ?? script.method[0]}`,
      `A1 — answer: ${script.method[2] ?? "State the final value with its unit, clearly, on its own line."}`,
      `B1 — quality: ${script.method[3] ?? "Add the check or the assumption the question invites."}`,
      `On a question phrased like "${shortQuote(question)}", the marks sit in the words, so write the physics in sentences before any arithmetic.`,
    ],
    pitfall: script.pitfall,
    check: script.check,
  };
}
