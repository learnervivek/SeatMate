import { z } from 'zod';
import { BERTH_TYPES } from '../../types/domain';

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id');

const seatRangeSchema = z
  .object({
    min: z.number().int().positive(),
    max: z.number().int().positive(),
  })
  .refine((range) => range.max >= range.min, {
    message: 'max must be greater than or equal to min',
    path: ['max'],
  });

export const createPreferenceSchema = z.object({
  journeyId: objectId,
  desiredBerthTypes: z.array(z.enum(BERTH_TYPES)).min(1, 'Select at least one desired seat/berth type'),
  sameCoach: z.boolean().optional(),
  preferredSeatRange: seatRangeSchema.optional(),
});
export type CreatePreferenceInput = z.infer<typeof createPreferenceSchema>;

export const updatePreferenceSchema = z
  .object({
    desiredBerthTypes: z.array(z.enum(BERTH_TYPES)).min(1).optional(),
    sameCoach: z.boolean().optional(),
    preferredSeatRange: seatRangeSchema.optional(),
    status: z.enum(['active', 'cancelled']).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, 'At least one field must be provided');
export type UpdatePreferenceInput = z.infer<typeof updatePreferenceSchema>;

export const preferenceIdParamSchema = z.object({
  id: objectId,
});
