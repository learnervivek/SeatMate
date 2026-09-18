import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import http from 'http';
import type { AddressInfo } from 'net';
import request from 'supertest';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import { createApp } from '../app';
import { initSocketServer } from '../sockets';
import { connectTestDb, disconnectTestDb, clearTestDb } from './db';

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

// Same train/date/class, complementary berths — see mockPnrData.ts.
const PNR_UPPER = '2458761023';
const PNR_LOWER = '2458761024';

function extractCookie(res: request.Response): string {
  const setCookie = res.headers['set-cookie'];
  const raw = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  if (!raw) throw new Error('No Set-Cookie header on response');
  return raw.split(';')[0]!;
}

interface TestServer {
  httpServer: http.Server;
  port: number;
  close: () => Promise<void>;
}

async function startTestServer(): Promise<TestServer> {
  const app = createApp();
  const httpServer = http.createServer(app);
  initSocketServer(httpServer);
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const port = (httpServer.address() as AddressInfo).port;
  return {
    httpServer,
    port,
    close: () =>
      new Promise<void>((resolve, reject) => {
        httpServer.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

function connectSocket(port: number, cookie: string): Promise<ClientSocket> {
  return new Promise((resolve, reject) => {
    const socket = ioClient(`http://localhost:${port}`, {
      extraHeaders: { Cookie: cookie },
      transports: ['websocket'],
      reconnection: false,
    });
    const timer = setTimeout(() => reject(new Error('socket connect timed out')), 5000);
    socket.on('connect', () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

function waitForEvent<T = unknown>(socket: ClientSocket, event: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out waiting for ${event}`)), 5000);
    socket.once(event, (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

describe('Socket.IO swap workflow notifications', () => {
  it('delivers a request notification, then an accept notification, over the socket', async () => {
    const server = await startTestServer();
    const clientSockets: ClientSocket[] = [];
    try {
      const agent = request(server.httpServer);

      const registerA = await agent
        .post('/api/auth/register')
        .send({ name: 'Socket A', email: 'socketa@example.com', password: 'password123' });
      const registerB = await agent
        .post('/api/auth/register')
        .send({ name: 'Socket B', email: 'socketb@example.com', password: 'password123' });
      const cookieA = extractCookie(registerA);
      const cookieB = extractCookie(registerB);

      const journeyA = (await agent.post('/api/pnr/verify').set('Cookie', cookieA).send({ pnr: PNR_UPPER })).body
        .journey;
      const journeyB = (await agent.post('/api/pnr/verify').set('Cookie', cookieB).send({ pnr: PNR_LOWER })).body
        .journey;
      await agent
        .post('/api/preferences')
        .set('Cookie', cookieA)
        .send({ journeyId: journeyA._id, desiredBerthTypes: ['lower'] });

      const socketA = await connectSocket(server.port, cookieA);
      const socketB = await connectSocket(server.port, cookieB);
      clientSockets.push(socketA, socketB);

      // 1. Request notification: B is notified in real time when A sends the request.
      const receivedByB = waitForEvent<{ type: string }>(socketB, 'notification:new');
      const createRes = await agent
        .post('/api/swaps')
        .set('Cookie', cookieA)
        .send({ requesterJourneyId: journeyA._id, receiverJourneyId: journeyB._id });
      const swapRequestId = createRes.body.swapRequest._id;
      const requestNotification = await receivedByB;
      expect(requestNotification.type).toBe('swap_request_received');

      // 2. Accept notification: A is notified in real time when B accepts.
      const receivedByA = waitForEvent<{ type: string }>(socketA, 'notification:new');
      await agent.patch(`/api/swaps/${swapRequestId}/accept`).set('Cookie', cookieB);
      const acceptNotification = await receivedByA;
      expect(acceptNotification.type).toBe('swap_request_completed');
    } finally {
      clientSockets.forEach((s) => s.disconnect());
      await server.close();
    }
  });

  it('delivers a reject notification to the requester over the socket', async () => {
    const server = await startTestServer();
    const clientSockets: ClientSocket[] = [];
    try {
      const agent = request(server.httpServer);

      const registerA = await agent
        .post('/api/auth/register')
        .send({ name: 'Reject A', email: 'rejecta@example.com', password: 'password123' });
      const registerB = await agent
        .post('/api/auth/register')
        .send({ name: 'Reject B', email: 'rejectb@example.com', password: 'password123' });
      const cookieA = extractCookie(registerA);
      const cookieB = extractCookie(registerB);

      const journeyA = (await agent.post('/api/pnr/verify').set('Cookie', cookieA).send({ pnr: PNR_UPPER })).body
        .journey;
      const journeyB = (await agent.post('/api/pnr/verify').set('Cookie', cookieB).send({ pnr: PNR_LOWER })).body
        .journey;
      await agent
        .post('/api/preferences')
        .set('Cookie', cookieA)
        .send({ journeyId: journeyA._id, desiredBerthTypes: ['lower'] });

      const createRes = await agent
        .post('/api/swaps')
        .set('Cookie', cookieA)
        .send({ requesterJourneyId: journeyA._id, receiverJourneyId: journeyB._id });
      const swapRequestId = createRes.body.swapRequest._id;

      const socketA = await connectSocket(server.port, cookieA);
      clientSockets.push(socketA);

      const receivedByA = waitForEvent<{ type: string }>(socketA, 'notification:new');
      await agent.patch(`/api/swaps/${swapRequestId}/reject`).set('Cookie', cookieB);
      const rejectNotification = await receivedByA;
      expect(rejectNotification.type).toBe('swap_request_rejected');
    } finally {
      clientSockets.forEach((s) => s.disconnect());
      await server.close();
    }
  });

  it('refuses a socket connection that has no valid auth cookie', async () => {
    const server = await startTestServer();
    try {
      await expect(connectSocket(server.port, 'seatmate_token=not-a-real-token')).rejects.toBeDefined();
    } finally {
      await server.close();
    }
  });
});
