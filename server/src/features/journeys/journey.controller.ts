import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { getOwnedJourneyOrThrow, listJourneysForUser } from './journey.service';

export const listMyJourneys = asyncHandler(async (req: Request, res: Response) => {
  const journeys = await listJourneysForUser(req.user!.sub);
  res.status(200).json({ journeys });
});

export const getJourney = asyncHandler(async (req: Request, res: Response) => {
  const journey = await getOwnedJourneyOrThrow(req.user!.sub, req.params.journeyId as string);
  res.status(200).json({ journey });
});
