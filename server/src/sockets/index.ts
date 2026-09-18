import type { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cookie from 'cookie';
import { env } from '../config/env';
import { verifyAccessToken } from '../lib/jwt';
import { logger } from '../lib/logger';

let io: SocketIOServer | undefined;

function userRoom(userId: string): string {
  return `user:${userId}`;
}

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const rawCookies = socket.handshake.headers.cookie;
      const token = rawCookies ? cookie.parse(rawCookies)[env.COOKIE_NAME] : undefined;

      if (!token) {
        next(new Error('Unauthorized'));
        return;
      }

      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    socket.join(userRoom(userId));
    logger.info('Socket connected', { userId, socketId: socket.id });

    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', { userId, socketId: socket.id, reason });
    });
  });

  return io;
}

export function emitToUser(userId: string, event: string, payload: unknown): void {
  if (!io) {
    logger.warn('Attempted to emit before socket server was initialized');
    return;
  }
  io.to(userRoom(userId)).emit(event, payload);
}
