/**
 * The seeded activity catalogue. Every round is pushed through the same
 * `validateRound` gate the model output goes through, so a typo in content
 * fails here at module load rather than in front of a child.
 */
import { semanticCheck, validateRound, type PlayActivity, type PlayBand, type PlayStrand } from "@/lib/domain/play";
import { EARLY_ACTIVITIES } from "./early";
import { LOWER_PRIMARY_ACTIVITIES } from "./lower-primary";
import { UPPER_PRIMARY_ACTIVITIES } from "./upper-primary";

function vetted(activities: PlayActivity[]): PlayActivity[] {
  return activities.map((activity) => {
    const rounds = activity.rounds.filter((round) => {
      if (round.kind !== activity.kind) return false;
      return validateRound(activity.kind, round) !== null && semanticCheck(activity.id, round);
    });
    if (rounds.length !== activity.rounds.length) {
      console.warn(`[play] ${activity.id}: ${activity.rounds.length - rounds.length} seeded round(s) failed validation and were dropped`);
    }
    return { ...activity, rounds };
  });
}

export const PLAY_ACTIVITIES: PlayActivity[] = vetted([...EARLY_ACTIVITIES, ...LOWER_PRIMARY_ACTIVITIES, ...UPPER_PRIMARY_ACTIVITIES]);

export const activityById = new Map(PLAY_ACTIVITIES.map((a) => [a.id, a]));

export function activitiesForBand(band: PlayBand): PlayActivity[] {
  return PLAY_ACTIVITIES.filter((a) => a.band === band);
}

/** Activities of one band grouped by strand, in a stable order for the shelf. */
const STRAND_ORDER: PlayStrand[] = ["literacy", "numeracy", "shapes", "islamic", "urdu"];

export function shelvesForBand(band: PlayBand): { strand: PlayStrand; activities: PlayActivity[] }[] {
  return STRAND_ORDER.map((strand) => ({ strand, activities: activitiesForBand(band).filter((a) => a.strand === strand) })).filter((shelf) => shelf.activities.length > 0);
}
