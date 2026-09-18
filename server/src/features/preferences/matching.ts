import type { BerthType } from '../../types/domain';

/**
 * Pure matching engine — no database access, no Express types. Everything
 * here operates on plain data so it can be unit tested in isolation and
 * improved later (e.g. smarter scoring) without touching controllers,
 * routes, or the DB-orchestration layer in matching.service.ts.
 */

export interface MatchSeat {
  coach?: string | null;
  seatNumber: string;
  berthType: BerthType;
}

export interface MatchCandidateInput {
  journeyId: string;
  passengerName: string;
  currentSeat: MatchSeat;
  desiredBerthTypes: BerthType[];
  sameCoach: boolean;
  preferredSeatRange?: { min: number; max: number } | null;
}

export interface MatchResult {
  journeyId: string;
  passenger: { name: string };
  currentSeat: MatchSeat;
  theirDesiredBerthTypes: BerthType[];
  score: number;
  reasons: string[];
}

const BASE_SCORE = 40;
const MUTUAL_BONUS = 35;
const SAME_COACH_BONUS = 15;
const SEAT_RANGE_BONUS = 10;
const MAX_SCORE = 100;

function berthLabel(berthType: BerthType): string {
  return berthType.replace('-', ' ');
}

function isWithinSeatRange(seatNumber: string, range: { min: number; max: number }): boolean {
  const numeric = parseInt(seatNumber, 10);
  return !Number.isNaN(numeric) && numeric >= range.min && numeric <= range.max;
}

/**
 * Evaluates one candidate against the requesting passenger. Returns null if
 * the candidate fails a hard requirement (doesn't hold a berth type the
 * passenger wants, or the passenger has restricted matches to their own
 * coach and the candidate is in a different one) — otherwise a scored,
 * explained match.
 */
export function evaluateMatch(
  self: MatchCandidateInput,
  candidate: MatchCandidateInput,
): MatchResult | null {
  // 1. The other passenger must currently hold a berth type this user wants.
  if (!self.desiredBerthTypes.includes(candidate.currentSeat.berthType)) {
    return null;
  }

  // 3. Same-coach is a hard constraint when the user explicitly asked for it.
  if (self.sameCoach) {
    if (
      !self.currentSeat.coach ||
      !candidate.currentSeat.coach ||
      self.currentSeat.coach !== candidate.currentSeat.coach
    ) {
      return null;
    }
  }

  const reasons: string[] = [`Has the ${berthLabel(candidate.currentSeat.berthType)} berth you're looking for`];
  let score = BASE_SCORE;

  // 2. Whether the other passenger wants this user's current berth type —
  // genuine two-way compatibility is the strongest signal a swap will work.
  const mutual = candidate.desiredBerthTypes.includes(self.currentSeat.berthType);
  if (mutual) {
    score += MUTUAL_BONUS;
    reasons.push('Wants your seat too — a genuine two-way match');
  }

  const sameCoach =
    Boolean(self.currentSeat.coach) && self.currentSeat.coach === candidate.currentSeat.coach;
  if (sameCoach) {
    score += SAME_COACH_BONUS;
    reasons.push('Same coach');
  }

  if (self.preferredSeatRange && isWithinSeatRange(candidate.currentSeat.seatNumber, self.preferredSeatRange)) {
    score += SEAT_RANGE_BONUS;
    reasons.push('Seat number falls within your preferred range');
  }

  return {
    journeyId: candidate.journeyId,
    passenger: { name: candidate.passengerName },
    currentSeat: candidate.currentSeat,
    theirDesiredBerthTypes: candidate.desiredBerthTypes,
    score: Math.min(score, MAX_SCORE),
    reasons,
  };
}

/**
 * Evaluates and ranks every candidate for `self`, strongest match first.
 * Candidates that fail a hard requirement are silently dropped — this
 * function only ever *surfaces* potential matches, it never acts on them.
 */
export function rankMatches(
  self: MatchCandidateInput,
  candidates: MatchCandidateInput[],
): MatchResult[] {
  return candidates
    .map((candidate) => evaluateMatch(self, candidate))
    .filter((result): result is MatchResult => result !== null)
    .sort((a, b) => b.score - a.score);
}
