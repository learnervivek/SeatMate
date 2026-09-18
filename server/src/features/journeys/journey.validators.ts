import { z } from 'zod';

export const journeyIdParamSchema = z.object({
  journeyId: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid journey id'),
});
