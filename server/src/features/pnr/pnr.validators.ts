import { z } from 'zod';

export const verifyPnrSchema = z.object({
  pnr: z.string().trim().min(4, 'PNR looks too short').max(20, 'PNR looks too long'),
});
export type VerifyPnrInput = z.infer<typeof verifyPnrSchema>;
