import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { NotFoundError } from '../../lib/errors';
import { findMatchesForJourney } from './matching.service';
import {
  createOrUpdatePreference,
  getPreferenceForJourneyOwned,
  updatePreference,
} from './preference.service';
import type { CreatePreferenceInput, UpdatePreferenceInput } from './preference.validators';

export const createPreference = asyncHandler(async (req: Request, res: Response) => {
  const { journeyId, ...rest } = req.body as CreatePreferenceInput;
  const preference = await createOrUpdatePreference(req.user!.sub, journeyId, rest);
  res.status(200).json({ preference });
});

export const getPreference = asyncHandler(async (req: Request, res: Response) => {
  const preference = await getPreferenceForJourneyOwned(
    req.user!.sub,
    req.params.journeyId as string,
  );
  if (!preference) {
    throw new NotFoundError('No preference set for this journey');
  }
  res.status(200).json({ preference });
});

export const patchPreference = asyncHandler(async (req: Request, res: Response) => {
  const updates = req.body as UpdatePreferenceInput;
  const preference = await updatePreference(req.user!.sub, req.params.id as string, updates);
  res.status(200).json({ preference });
});

export const getMatches = asyncHandler(async (req: Request, res: Response) => {
  const matches = await findMatchesForJourney(req.user!.sub, req.params.journeyId as string);
  res.status(200).json({ matches });
});
