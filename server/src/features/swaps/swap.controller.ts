import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import {
  acceptSwapRequest,
  cancelSwapRequest,
  createSwapRequest,
  listIncomingForUser,
  listOutgoingForUser,
  rejectSwapRequest,
} from './swap.service';
import type { CreateSwapRequestInput } from './swap.validators';

export const sendSwapRequest = asyncHandler(async (req: Request, res: Response) => {
  const { requesterJourneyId, receiverJourneyId, message } = req.body as CreateSwapRequestInput;
  const swapRequest = await createSwapRequest(
    req.user!.sub,
    requesterJourneyId,
    receiverJourneyId,
    message,
  );
  res.status(201).json({ swapRequest });
});

export const listIncoming = asyncHandler(async (req: Request, res: Response) => {
  const swapRequests = await listIncomingForUser(req.user!.sub);
  res.status(200).json({ swapRequests });
});

export const listOutgoing = asyncHandler(async (req: Request, res: Response) => {
  const swapRequests = await listOutgoingForUser(req.user!.sub);
  res.status(200).json({ swapRequests });
});

export const acceptRequest = asyncHandler(async (req: Request, res: Response) => {
  const swapRequest = await acceptSwapRequest(req.user!.sub, req.params.id as string);
  res.status(200).json({ swapRequest });
});

export const rejectRequest = asyncHandler(async (req: Request, res: Response) => {
  const swapRequest = await rejectSwapRequest(req.user!.sub, req.params.id as string);
  res.status(200).json({ swapRequest });
});

export const cancelRequest = asyncHandler(async (req: Request, res: Response) => {
  const swapRequest = await cancelSwapRequest(req.user!.sub, req.params.id as string);
  res.status(200).json({ swapRequest });
});
