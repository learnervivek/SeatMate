import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { verifyPnrForUser } from '../journeys/journey.service';
import type { VerifyPnrInput } from './pnr.validators';

export const verifyPnr = asyncHandler(async (req: Request, res: Response) => {
  const { pnr } = req.body as VerifyPnrInput;
  const journey = await verifyPnrForUser(req.user!.sub, pnr);
  res.status(200).json({ journey });
});
