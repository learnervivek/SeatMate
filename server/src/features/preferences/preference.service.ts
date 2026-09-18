import { BadRequestError, NotFoundError } from '../../lib/errors';
import { berthTypesForTransport } from '../../types/domain';
import type { BerthType } from '../../types/domain';
import { getOwnedJourneyOrThrow } from '../journeys/journey.service';
import { SwapPreferenceModel, type SwapPreferenceDocument } from './swapPreference.model';
import type { CreatePreferenceInput, UpdatePreferenceInput } from './preference.validators';

function assertBerthTypesValidForTransport(
  desiredBerthTypes: BerthType[],
  transportType: 'train' | 'flight',
): void {
  const validTypes = berthTypesForTransport(transportType);
  const invalid = desiredBerthTypes.filter((type) => !validTypes.includes(type));
  if (invalid.length > 0) {
    throw new BadRequestError(`Invalid seat type(s) for a ${transportType}: ${invalid.join(', ')}`);
  }
}

export async function createOrUpdatePreference(
  userId: string,
  journeyId: string,
  input: Omit<CreatePreferenceInput, 'journeyId'>,
): Promise<SwapPreferenceDocument> {
  const journey = await getOwnedJourneyOrThrow(userId, journeyId);
  assertBerthTypesValidForTransport(input.desiredBerthTypes, journey.transportType);

  return SwapPreferenceModel.findOneAndUpdate(
    { journeyId },
    {
      userId,
      journeyId,
      currentSeat: journey.assignedSeat,
      desiredBerthTypes: input.desiredBerthTypes,
      sameCoach: input.sameCoach ?? false,
      preferredSeatRange: input.preferredSeatRange,
      status: 'active',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

export async function getPreferenceForJourneyOwned(
  userId: string,
  journeyId: string,
): Promise<SwapPreferenceDocument | null> {
  return SwapPreferenceModel.findOne({ userId, journeyId });
}

export async function getPreferenceForJourney(
  journeyId: string,
): Promise<SwapPreferenceDocument | null> {
  return SwapPreferenceModel.findOne({ journeyId });
}

export async function getOwnedPreferenceByIdOrThrow(
  userId: string,
  preferenceId: string,
): Promise<SwapPreferenceDocument> {
  const preference = await SwapPreferenceModel.findOne({ _id: preferenceId, userId });
  if (!preference) {
    throw new NotFoundError('Preference not found');
  }
  return preference;
}

export async function updatePreference(
  userId: string,
  preferenceId: string,
  updates: UpdatePreferenceInput,
): Promise<SwapPreferenceDocument> {
  const preference = await getOwnedPreferenceByIdOrThrow(userId, preferenceId);

  if (updates.desiredBerthTypes) {
    const journey = await getOwnedJourneyOrThrow(userId, preference.journeyId.toString());
    assertBerthTypesValidForTransport(updates.desiredBerthTypes, journey.transportType);
    preference.desiredBerthTypes = updates.desiredBerthTypes;
    // Re-snapshot the current seat (it may have changed since this
    // preference was created or last updated, e.g. via a completed swap),
    // and re-activate — stating a new preference is itself an opt back in,
    // otherwise a preference left 'matched' by a past swap could never be
    // used again without an explicit status change no client ever sends.
    preference.currentSeat = journey.assignedSeat;
    preference.status = 'active';
  }
  if (updates.sameCoach !== undefined) {
    preference.sameCoach = updates.sameCoach;
  }
  if (updates.preferredSeatRange !== undefined) {
    preference.preferredSeatRange = updates.preferredSeatRange;
  }
  if (updates.status) {
    preference.status = updates.status;
  }

  await preference.save();
  return preference;
}
