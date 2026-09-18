import { z } from 'zod';

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id');

export const createSwapRequestSchema = z.object({
  requesterJourneyId: objectId,
  receiverJourneyId: objectId,
  message: z.string().trim().max(280).optional(),
});
export type CreateSwapRequestInput = z.infer<typeof createSwapRequestSchema>;

export const swapRequestIdParamSchema = z.object({
  id: objectId,
});
