import { BadRequestError } from '../../lib/errors';
import { JourneyModel } from '../journeys/journey.model';
import { getOwnedJourneyOrThrow } from '../journeys/journey.service';
import { rankMatches, type MatchCandidateInput, type MatchResult } from './matching';
import { SwapPreferenceModel } from './swapPreference.model';

export type { MatchResult } from './matching';

/**
 * Finds and ranks potential swap partners for a journey. This only reads
 * data and computes scores — it never creates, accepts, or otherwise acts on
 * a swap. See matching.ts for the actual scoring logic (unit tested there).
 */
export async function findMatchesForJourney(userId: string, journeyId: string): Promise<MatchResult[]> {
  const journey = await getOwnedJourneyOrThrow(userId, journeyId);

  const ownPreference = await SwapPreferenceModel.findOne({ userId, journeyId, status: 'active' });
  if (!ownPreference) {
    throw new BadRequestError('Set your seat preference before searching for matches');
  }

  // 4 & 5. "Overlapping" / "compatible" journeys — same train or flight,
  // date, and class. Only journeys satisfying this are ever considered.
  const candidateJourneys = await JourneyModel.find({
    vehicleNumber: journey.vehicleNumber,
    travelDate: journey.travelDate,
    class: journey.class,
    transportType: journey.transportType,
    userId: { $ne: userId },
    status: 'active',
  }).populate<{ userId: { name: string } }>('userId', 'name');

  if (candidateJourneys.length === 0) {
    return [];
  }

  // 6. "Still available for swapping inside the application" — the other
  // passenger must have an active preference of their own; simply holding a
  // seat someone wants isn't enough, they must have opted into swapping.
  const candidatePreferences = await SwapPreferenceModel.find({
    journeyId: { $in: candidateJourneys.map((j) => j._id) },
    status: 'active',
  });
  const preferenceByJourneyId = new Map(
    candidatePreferences.map((preference) => [preference.journeyId.toString(), preference]),
  );

  const selfInput: MatchCandidateInput = {
    journeyId: journey._id.toString(),
    passengerName: '',
    currentSeat: ownPreference.currentSeat,
    desiredBerthTypes: ownPreference.desiredBerthTypes,
    sameCoach: ownPreference.sameCoach,
    preferredSeatRange: ownPreference.preferredSeatRange,
  };

  const candidateInputs: MatchCandidateInput[] = [];
  for (const candidateJourney of candidateJourneys) {
    const preference = preferenceByJourneyId.get(candidateJourney._id.toString());
    if (!preference) continue;

    candidateInputs.push({
      journeyId: candidateJourney._id.toString(),
      passengerName: candidateJourney.userId.name,
      currentSeat: candidateJourney.assignedSeat,
      desiredBerthTypes: preference.desiredBerthTypes,
      sameCoach: preference.sameCoach,
      preferredSeatRange: preference.preferredSeatRange,
    });
  }

  return rankMatches(selfInput, candidateInputs);
}
