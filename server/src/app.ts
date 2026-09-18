import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env, isProduction } from './config/env';
import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authRouter } from './features/auth/auth.routes';
import { journeyRouter } from './features/journeys/journey.routes';
import { pnrRouter } from './features/pnr/pnr.routes';
import { preferenceRouter } from './features/preferences/preference.routes';
import { swapRouter } from './features/swaps/swap.routes';
import { notificationRouter } from './features/notifications/notification.routes';

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(morgan(isProduction ? 'combined' : 'dev'));
  app.use(apiRateLimiter);

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/journeys', journeyRouter);
  app.use('/api/pnr', pnrRouter);
  app.use('/api/preferences', preferenceRouter);
  app.use('/api/swaps', swapRouter);
  app.use('/api/notifications', notificationRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
