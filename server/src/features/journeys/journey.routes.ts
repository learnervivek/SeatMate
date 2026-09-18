import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { validate } from '../../middleware/validate';
import { getJourney, listMyJourneys } from './journey.controller';
import { journeyIdParamSchema } from './journey.validators';

export const journeyRouter = Router();

journeyRouter.use(requireAuth);

journeyRouter.get('/', listMyJourneys);
journeyRouter.get('/:journeyId', validate({ params: journeyIdParamSchema }), getJourney);
