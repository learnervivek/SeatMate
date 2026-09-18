import { z } from 'zod';

export const notificationIdParamSchema = z.object({
  notificationId: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id'),
});
