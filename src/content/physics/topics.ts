/**
 * 9702 topic metadata: which half of the course a strand belongs to, and the
 * formulae a student is expected to reach for.
 *
 * The strand names themselves come from the ported Exam Lab bank so a question,
 * a misconception, a library entry and a studio answer all tag the same string.
 * Formulae are written in plain Unicode, never LaTeX — see ./latex.ts.
 */
import { A2_TOPICS, ALL_TOPICS, AS_TOPICS, TOPICS } from "./bank";

export { TOPICS, ALL_TOPICS, AS_TOPICS, A2_TOPICS };

export const SYLLABUS_NAME = "Cambridge International AS & A Level Physics (9702)";
export const SYLLABUS_YEARS = "2025-2027";
export const SYLLABUS_URL = "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-international-as-and-a-level-physics-9702/";

export type TopicGroup = "AS" | "A2";

const AS_SET = new Set(AS_TOPICS);

export function topicGroup(topic: string): TopicGroup {
  return AS_SET.has(topic) ? "AS" : "A2";
}

export function isTopic(value: string): boolean {
  return ALL_TOPICS.includes(value);
}

/** The relationships each strand turns on, as a student would write them. */
export const FORMULAE: Record<string, string[]> = {
  "Physical quantities & units": ["base units: kg, m, s, A, K, mol, cd", "homogeneity: every term must carry the same units", "percentage uncertainty adds for a product"],
  Kinematics: ["v = u + at", "s = ut + ½at²", "v² = u² + 2as", "gradient of a displacement-time graph is velocity; area under a velocity-time graph is displacement"],
  Dynamics: ["F = ma for constant mass", "F = Δp/Δt", "p = mv", "momentum is conserved in every collision"],
  "Forces, density & pressure": ["moment = force × perpendicular distance", "p = F/A", "p = ρgh", "upthrust = ρgV displaced"],
  "Work, energy & power": ["W = Fs cos θ", "Eₖ = ½mv²", "ΔEₚ = mgΔh", "P = Fv", "efficiency = useful output / total input"],
  "Deformation of solids": ["F = kx", "stress = F/A", "strain = x/L", "E = stress / strain", "elastic PE = ½Fx"],
  Waves: ["v = fλ", "T = 1/f", "intensity ∝ amplitude²", "Δλ/λ ≈ v/c for a small Doppler shift"],
  Superposition: ["λ = ax/D for double slits", "d sin θ = nλ for a grating", "stationary wave: adjacent nodes are λ/2 apart"],
  Electricity: ["I = Q/t", "I = nAvq", "V = W/Q", "R = V/I", "R = ρL/A"],
  "D.C. circuits": ["series: R = R₁ + R₂", "parallel: 1/R = 1/R₁ + 1/R₂", "V = ε − Ir", "potential divider: Vout = Vin R₂/(R₁ + R₂)"],
  "Particle physics": ["proton = uud, neutron = udd", "charge and nucleon number balance in every decay", "β⁻ emits an electron and an electron antineutrino"],
  "Circular motion": ["ω = 2π/T", "v = rω", "a = v²/r = rω²", "F = mv²/r"],
  "Gravitational fields": ["F = GMm/r²", "g = GM/r²", "φ = −GM/r", "T² = 4π²r³/GM"],
  "Thermal physics": ["Q = mcΔθ", "Q = mL", "ΔU = q + w", "T/K = θ/°C + 273.15"],
  "Ideal gases": ["pV = nRT = NkT", "pV = ⅓Nm⟨c²⟩", "mean kinetic energy = (3/2)kT"],
  Oscillations: ["a = −ω²x", "x = x₀ sin ωt", "v = ±ω√(x₀² − x²)", "E = ½mω²x₀²"],
  "Electric fields": ["E = F/q", "E = V/d between parallel plates", "F = Q₁Q₂/(4πε₀r²)", "V = Q/(4πε₀r)"],
  Capacitance: ["C = Q/V", "series: 1/C = 1/C₁ + 1/C₂", "parallel: C = C₁ + C₂", "W = ½CV²", "x = x₀e^(−t/RC)"],
  "Magnetic fields": ["F = BIL sin θ", "F = BQv sin θ", "Φ = BA cos θ", "induced e.m.f. = −dΦ/dt"],
  "Alternating currents": ["I₀ = √2 × Irms", "mean power = ½I₀V₀", "⟨P⟩ = Irms Vrms for a resistor"],
  "Quantum physics": ["E = hf", "hf = Φ + ½mv²max", "λ = h/p", "photon energy in eV = E/1.60 × 10⁻¹⁹"],
  "Nuclear physics": ["A = λN", "N = N₀e^(−λt)", "t½ = ln2/λ", "E = mc² for the mass defect"],
  "Astronomy & cosmology": ["L = 4πσr²T⁴", "λmax T = 2.9 × 10⁻³ m K", "v = H₀d", "Δλ/λ ≈ v/c"],
};

export function formulaeFor(topic: string): string[] {
  return FORMULAE[topic] ?? [];
}

/** The paper a strand is normally examined on, used when a question has no explicit paper. */
export function defaultPaper(topic: string): "P2" | "P4" {
  return topicGroup(topic) === "AS" ? "P2" : "P4";
}
