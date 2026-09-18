import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { validate } from '../../middleware/validate';
import { journeyIdParamSchema } from '../journeys/journey.validators';
import { createPreference, getMatches, getPreference, patchPreference } from './preference.controller';
import {
  createPreferenceSchema,
  preferenceIdParamSchema,
  updatePreferenceSchema,
} from './preference.validators';

export const preferenceRouter = Router();

preferenceRouter.use(requireAuth);

preferenceRouter.post('/', validate({ body: createPreferenceSchema }), createPreference);
preferenceRouter.get('/:journeyId', validate({ params: journeyIdParamSchema }), getPreference);
preferenceRouter.get(
  '/:journeyId/matches',
  validate({ params: journeyIdParamSchema }),
  getMatches,
);
preferenceRouter.patch(
  '/:id',
  validate({ params: preferenceIdParamSchema, body: updatePreferenceSchema }),
  patchPreference,
);
