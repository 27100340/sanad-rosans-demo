/**
 * The Physics cohort: who is in it, how strong each student is, and the
 * misconceptions the marking has picked up this term.
 *
 * The students are Sanad's own senior group (lib/data/mock/people), so a
 * physics allocation lands on a real persona and can actually be sat. Rosans
 * teaches O Level; the 9702 material is framed here as the school's AS Physics
 * fast-track for that group. Adding a genuine Year 12 class and an AS Physics
 * teacher persona is a change to shared files — see the report.
 *
 * Ability profiles drive ./seed-attempts.ts, which builds the term's attempt
 * history from real bank questions rather than from invented percentages, so
 * every number on the analytics pages traces back to a question that exists.
 */
import type { Misconception } from "@/lib/domain/physics";

export const PHYSICS_CLASS_ID = "gulberg-o1";
export const PHYSICS_TEACHER_ID = "t-usman-tariq";
export const PHYSICS_TERM = "Term 1";
export const PHYSICS_GROUP_NAME = "AS Physics 9702";

/**
 * How a student performs, as two numbers the attempt generator reads.
 * `lot` and `hot` are the probability of earning each available mark on a
 * lower-order and a higher-order question. The gap between them is the point:
 * almost every student is weaker on HOT, which is what the class view shows.
 */
export interface AbilityProfile {
  studentId: string;
  lot: number;
  hot: number;
  /** Attempts sat this term. */
  attempts: number;
  /** Strands this student has been set extra work on, so they appear more often. */
  focus: string[];
}

export const ABILITY: AbilityProfile[] = [
  { studentId: "s-hafsa-tariq", lot: 0.93, hot: 0.81, attempts: 6, focus: ["Quantum physics", "Capacitance"] },
  { studentId: "s-sana-khalid", lot: 0.88, hot: 0.72, attempts: 5, focus: ["Oscillations", "Magnetic fields"] },
  { studentId: "s-zoya-imran", lot: 0.85, hot: 0.68, attempts: 5, focus: ["Superposition", "Gravitational fields"] },
  { studentId: "s-eman-siddiqui", lot: 0.82, hot: 0.63, attempts: 4, focus: ["Thermal physics", "Ideal gases"] },
  { studentId: "s-laiba-noor", lot: 0.78, hot: 0.58, attempts: 4, focus: ["D.C. circuits", "Electric fields"] },
  { studentId: "s-ali-hamza", lot: 0.74, hot: 0.51, attempts: 5, focus: ["Magnetic fields", "Circular motion"] },
  { studentId: "s-shayan-ali", lot: 0.71, hot: 0.46, attempts: 4, focus: ["Kinematics", "Dynamics"] },
  { studentId: "s-rayyan-malik", lot: 0.68, hot: 0.44, attempts: 3, focus: ["Superposition", "Waves"] },
  { studentId: "s-daniyal-butt", lot: 0.61, hot: 0.36, attempts: 3, focus: ["Deformation of solids", "Work, energy & power"] },
  { studentId: "s-owais-qadir", lot: 0.54, hot: 0.29, attempts: 3, focus: ["Dynamics", "D.C. circuits"] },
];

export const abilityFor = new Map(ABILITY.map((a) => [a.studentId, a]));

/**
 * Misconceptions the marking picked up this term. Each is a real 9702
 * misconception, written the way the department would put it on the board.
 */
export const MISCONCEPTIONS: Misconception[] = [
  {
    tag: "centripetal-drawn-as-an-extra-force",
    topic: "Circular motion",
    count: 14,
    example: "Free-body diagram of a conical pendulum showing tension, weight and a separate arrow labelled 'centripetal force'.",
    correction: "Centripetal force is the name of the resultant, not another force. Name the real force providing it — here, the horizontal component of the tension.",
  },
  {
    tag: "kinetic-energy-assumed-conserved",
    topic: "Dynamics",
    count: 13,
    example: "\"The trolleys stick together, so kinetic energy before equals kinetic energy after.\"",
    correction: "Momentum is conserved in every collision; kinetic energy only in a perfectly elastic one. A collision where bodies stick is the maximally inelastic case.",
  },
  {
    tag: "parallel-resistances-added",
    topic: "D.C. circuits",
    count: 12,
    example: "6.0 Ω and 3.0 Ω in parallel written as 9.0 Ω.",
    correction: "Add the reciprocals: 1/R = 1/6.0 + 1/3.0 gives 2.0 Ω. The combination is always smaller than the smallest branch.",
  },
  {
    tag: "intensity-confused-with-photon-energy",
    topic: "Quantum physics",
    count: 12,
    example: "\"Making the light brighter gives the electrons more energy, so eventually they escape.\"",
    correction: "Intensity sets how many photons arrive, never the energy of each. Below the threshold frequency no intensity releases an electron.",
  },
  {
    tag: "gravitational-potential-sign-dropped",
    topic: "Gravitational fields",
    count: 11,
    example: "φ = GM/r quoted as positive, then used to claim energy is released moving away from the planet.",
    correction: "φ = −GM/r. Potential rises toward zero as r increases, so moving outward always costs energy.",
  },
  {
    tag: "temperature-left-in-celsius",
    topic: "Ideal gases",
    count: 11,
    example: "p₁V₁/T₁ = p₂V₂/T₂ worked with 27 °C and 54 °C, concluding the pressure doubles.",
    correction: "Every gas law needs kelvin. 27 °C and 54 °C are 300 K and 327 K — a 9% change, not 100%.",
  },
  {
    tag: "shm-defined-without-the-minus-sign",
    topic: "Oscillations",
    count: 10,
    example: "\"SHM is when acceleration is proportional to displacement.\"",
    correction: "a = −ω²x. Without 'and directed toward equilibrium', the definition describes something that accelerates away and never oscillates.",
  },
  {
    tag: "capacitors-combined-like-resistors",
    topic: "Capacitance",
    count: 10,
    example: "Two 100 μF capacitors in series given as 200 μF.",
    correction: "Capacitors are the other way round: add in parallel, add reciprocals in series. Two 100 μF in series give 50 μF.",
  },
  {
    tag: "emf-expected-from-a-steady-field",
    topic: "Magnetic fields",
    count: 9,
    example: "\"The magnet sits inside the coil, so there is a steady induced current.\"",
    correction: "Faraday's law is about the rate of change of flux linkage. A stationary magnet gives a constant flux, so the induced e.m.f. is zero.",
  },
  {
    tag: "peak-values-used-for-power",
    topic: "Alternating currents",
    count: 9,
    example: "Mean power computed as I₀V₀ from a 325 V peak supply.",
    correction: "Mean power is ½I₀V₀, equivalently Irms Vrms. That is the whole reason r.m.s. values are quoted.",
  },
  {
    tag: "activity-divided-by-half-lives",
    topic: "Nuclear physics",
    count: 8,
    example: "800 Bq after 3 half-lives given as 800/3 ≈ 267 Bq.",
    correction: "Halve it repeatedly: 800 → 400 → 200 → 100 Bq. Decay is exponential, not linear.",
  },
  {
    tag: "slit-separation-confused-with-fringe-spacing",
    topic: "Superposition",
    count: 8,
    example: "λ = ax/D worked with a as the fringe spacing and x as the slit separation.",
    correction: "a is the slit separation, x is the fringe spacing on the screen, D is the slit-to-screen distance. Label the diagram before substituting.",
  },
];

export function misconceptionsForTopic(topic: string): Misconception[] {
  return MISCONCEPTIONS.filter((m) => m.topic === topic).sort((a, b) => b.count - a.count);
}
