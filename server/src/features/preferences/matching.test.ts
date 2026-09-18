import { describe, expect, it } from 'vitest';
import { evaluateMatch, rankMatches, type MatchCandidateInput } from './matching';

function passenger(overrides: Partial<MatchCandidateInput>): MatchCandidateInput {
  return {
    journeyId: 'journey-a',
    passengerName: 'Passenger',
    currentSeat: { coach: 'B4', seatNumber: '10', berthType: 'lower' },
    desiredBerthTypes: [],
    sameCoach: false,
    ...overrides,
  };
}

describe('evaluateMatch', () => {
  it('produces a strong, mutual match when each passenger has what the other wants', () => {
    // A: Upper, wants Lower. B: Lower, wants Upper.
    const a = passenger({
      journeyId: 'a',
      currentSeat: { coach: 'S4', seatNumber: '72', berthType: 'upper' },
      desiredBerthTypes: ['lower'],
    });
    const b = passenger({
      journeyId: 'b',
      passengerName: 'B',
      currentSeat: { coach: 'S4', seatNumber: '45', berthType: 'lower' },
      desiredBerthTypes: ['upper'],
    });

    const result = evaluateMatch(a, b);

    expect(result).not.toBeNull();
    expect(result!.journeyId).toBe('b');
    expect(result!.reasons.some((r) => r.toLowerCase().includes('two-way'))).toBe(true);
    expect(result!.score).toBeGreaterThanOrEqual(75);
  });

  it('returns null when the candidate does not hold a berth type the requester wants', () => {
    const self = passenger({ desiredBerthTypes: ['upper'] });
    const candidate = passenger({ currentSeat: { seatNumber: '5', berthType: 'middle' } });

    expect(evaluateMatch(self, candidate)).toBeNull();
  });

  it('still surfaces a one-way match, but scores it lower than a mutual one', () => {
    const self = passenger({
      currentSeat: { coach: 'B4', seatNumber: '1', berthType: 'upper' },
      desiredBerthTypes: ['lower'],
    });
    // Candidate holds what self wants, but doesn't want self's berth type back.
    const oneWayCandidate = passenger({
      journeyId: 'one-way',
      currentSeat: { coach: 'B4', seatNumber: '2', berthType: 'lower' },
      desiredBerthTypes: ['middle'],
    });
    const mutualCandidate = passenger({
      journeyId: 'mutual',
      currentSeat: { coach: 'B4', seatNumber: '3', berthType: 'lower' },
      desiredBerthTypes: ['upper'],
    });

    const oneWayResult = evaluateMatch(self, oneWayCandidate)!;
    const mutualResult = evaluateMatch(self, mutualCandidate)!;

    expect(oneWayResult).not.toBeNull();
    expect(oneWayResult.reasons.some((r) => r.includes('two-way'))).toBe(false);
    expect(mutualResult.score).toBeGreaterThan(oneWayResult.score);
  });

  it('enforces sameCoach as a hard requirement when the requester opted in', () => {
    const self = passenger({
      currentSeat: { coach: 'B4', seatNumber: '1', berthType: 'upper' },
      desiredBerthTypes: ['lower'],
      sameCoach: true,
    });
    const differentCoach = passenger({
      currentSeat: { coach: 'B5', seatNumber: '2', berthType: 'lower' },
    });
    const sameCoach = passenger({
      currentSeat: { coach: 'B4', seatNumber: '2', berthType: 'lower' },
    });

    expect(evaluateMatch(self, differentCoach)).toBeNull();

    const result = evaluateMatch(self, sameCoach);
    expect(result).not.toBeNull();
    expect(result!.reasons).toContain('Same coach');
  });

  it('does not require same coach when the requester has not opted in, but still rewards it', () => {
    const self = passenger({
      currentSeat: { coach: 'B4', seatNumber: '1', berthType: 'upper' },
      desiredBerthTypes: ['lower'],
      sameCoach: false,
    });
    const otherCoach = passenger({ currentSeat: { coach: 'B9', seatNumber: '2', berthType: 'lower' } });
    const sameCoach = passenger({ currentSeat: { coach: 'B4', seatNumber: '3', berthType: 'lower' } });

    const otherResult = evaluateMatch(self, otherCoach)!;
    const sameResult = evaluateMatch(self, sameCoach)!;

    expect(otherResult).not.toBeNull();
    expect(sameResult.score).toBeGreaterThan(otherResult.score);
  });

  it('rewards a candidate seat number inside the preferred range, and not one outside it', () => {
    const self = passenger({
      currentSeat: { coach: 'B4', seatNumber: '1', berthType: 'upper' },
      desiredBerthTypes: ['lower'],
      preferredSeatRange: { min: 1, max: 20 },
    });
    const inRange = passenger({ journeyId: 'in', currentSeat: { seatNumber: '15', berthType: 'lower' } });
    const outOfRange = passenger({ journeyId: 'out', currentSeat: { seatNumber: '55', berthType: 'lower' } });

    const inRangeResult = evaluateMatch(self, inRange)!;
    const outOfRangeResult = evaluateMatch(self, outOfRange)!;

    expect(inRangeResult.reasons.some((r) => r.includes('preferred range'))).toBe(true);
    expect(outOfRangeResult.reasons.some((r) => r.includes('preferred range'))).toBe(false);
    expect(inRangeResult.score).toBeGreaterThan(outOfRangeResult.score);
  });

  it('never returns a score above 100', () => {
    const self = passenger({
      currentSeat: { coach: 'B4', seatNumber: '1', berthType: 'upper' },
      desiredBerthTypes: ['lower'],
      sameCoach: false,
      preferredSeatRange: { min: 1, max: 50 },
    });
    const perfectCandidate = passenger({
      currentSeat: { coach: 'B4', seatNumber: '10', berthType: 'lower' },
      desiredBerthTypes: ['upper'],
    });

    const result = evaluateMatch(self, perfectCandidate)!;
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('does not expose anything beyond passenger display name and seat/preference info', () => {
    const self = passenger({ desiredBerthTypes: ['lower'] });
    const candidate = passenger({ currentSeat: { seatNumber: '2', berthType: 'lower' } });

    const result = evaluateMatch(self, candidate)!;
    const keys = Object.keys(result.passenger);

    expect(keys).toEqual(['name']);
  });
});

describe('rankMatches', () => {
  it('drops non-matches and sorts the rest strongest-first', () => {
    const self = passenger({
      currentSeat: { coach: 'B4', seatNumber: '1', berthType: 'upper' },
      desiredBerthTypes: ['lower'],
    });
    const noMatch = passenger({ journeyId: 'no-match', currentSeat: { seatNumber: '2', berthType: 'middle' } });
    const weakMatch = passenger({
      journeyId: 'weak',
      currentSeat: { seatNumber: '3', berthType: 'lower' },
      desiredBerthTypes: ['middle'],
    });
    const strongMatch = passenger({
      journeyId: 'strong',
      currentSeat: { seatNumber: '4', berthType: 'lower' },
      desiredBerthTypes: ['upper'],
    });

    const results = rankMatches(self, [noMatch, weakMatch, strongMatch]);

    expect(results.map((r) => r.journeyId)).toEqual(['strong', 'weak']);
    expect(results[0]!.score).toBeGreaterThan(results[1]!.score);
  });

  it('never mutates or acts on candidates — it only returns scored data', () => {
    const self = passenger({ desiredBerthTypes: ['lower'] });
    const candidate = passenger({ currentSeat: { seatNumber: '2', berthType: 'lower' } });
    const snapshot = JSON.parse(JSON.stringify(candidate));

    rankMatches(self, [candidate]);

    expect(candidate).toEqual(snapshot);
  });
});
