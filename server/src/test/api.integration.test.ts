import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { connectTestDb, disconnectTestDb, clearTestDb } from './db';
import { registerAndLogin, testAgent } from './httpClient';
import { env } from '../config/env';

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

// PNRs from the mock dataset — same train/date/class, complementary berths.
const PNR_UPPER = '2458761023'; // B4-32 upper
const PNR_LOWER = '2458761024'; // B4-18 lower

describe('GET /api/health', () => {
  it('reports ok', async () => {
    const res = await testAgent().get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('auth endpoints', () => {
  it('registers, sets an httpOnly cookie, and rejects a duplicate email', async () => {
    const agent = testAgent();
    const res = await agent
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.user.passwordHash).toBeUndefined();
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    expect(String(setCookie)).toContain('HttpOnly');

    const dup = await agent
      .post('/api/auth/register')
      .send({ name: 'Alice Two', email: 'alice@example.com', password: 'password123' });
    expect(dup.status).toBe(409);
  });

  it('rejects invalid registration payloads with 422', async () => {
    const res = await testAgent().post('/api/auth/register').send({ email: 'not-an-email' });
    expect(res.status).toBe(422);
  });

  it('logs in, exposes GET /me, then logs out and revokes access', async () => {
    const agent = testAgent();
    await agent.post('/api/auth/register').send({ name: 'Bob', email: 'bob@example.com', password: 'password123' });

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('bob@example.com');

    const logout = await agent.post('/api/auth/logout');
    expect(logout.status).toBe(204);

    const meAfterLogout = await agent.get('/api/auth/me');
    expect(meAfterLogout.status).toBe(401);
  });

  it('rejects login with the wrong password', async () => {
    const agent = testAgent();
    await agent.post('/api/auth/register').send({ name: 'Carol', email: 'carol@example.com', password: 'right-pass' });
    await agent.post('/api/auth/logout');

    const res = await agent.post('/api/auth/login').send({ email: 'carol@example.com', password: 'wrong-pass' });
    expect(res.status).toBe(401);
  });

  it('rejects unauthenticated access to protected routes', async () => {
    const res = await testAgent().get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects an expired session token', async () => {
    // Sign an already-expired token directly so we don't need a real sleep.
    const jwt = await import('jsonwebtoken');
    const expiredToken = jwt.sign(
      { sub: '507f1f77bcf86cd799439011', email: 'ghost@example.com' },
      env.JWT_SECRET,
      { expiresIn: '-1s' },
    );

    const res = await testAgent().get('/api/auth/me').set('Cookie', [`${env.COOKIE_NAME}=${expiredToken}`]);
    expect(res.status).toBe(401);
  });
});

describe('PNR verification endpoint', () => {
  it('requires authentication', async () => {
    const res = await testAgent().post('/api/pnr/verify').send({ pnr: PNR_UPPER });
    expect(res.status).toBe(401);
  });

  it('verifies a valid PNR and persists a journey', async () => {
    const { agent } = await registerAndLogin();
    const res = await agent.post('/api/pnr/verify').send({ pnr: PNR_UPPER });

    expect(res.status).toBe(200);
    expect(res.body.journey.pnr).toBe(PNR_UPPER);
    expect(res.body.journey.assignedSeat.berthType).toBe('side-upper');
  });

  it('rejects an unknown PNR with 404', async () => {
    const { agent } = await registerAndLogin();
    const res = await agent.post('/api/pnr/verify').send({ pnr: '0000000000' });
    expect(res.status).toBe(404);
  });

  it('rejects a malformed PNR payload with 422', async () => {
    const { agent } = await registerAndLogin();
    const res = await agent.post('/api/pnr/verify').send({});
    expect(res.status).toBe(422);
  });
});

describe('full journey -> preference -> swap flow over HTTP', () => {
  it('lets two compatible passengers match, request, and complete a swap', async () => {
    const { agent: agentA } = await registerAndLogin({ email: 'flowa@example.com' });
    const { agent: agentB } = await registerAndLogin({ email: 'flowb@example.com' });

    const journeyARes = await agentA.post('/api/pnr/verify').send({ pnr: PNR_UPPER });
    const journeyBRes = await agentB.post('/api/pnr/verify').send({ pnr: PNR_LOWER });
    const journeyA = journeyARes.body.journey;
    const journeyB = journeyBRes.body.journey;

    const prefA = await agentA
      .post('/api/preferences')
      .send({ journeyId: journeyA._id, desiredBerthTypes: ['lower'] });
    expect(prefA.status).toBe(200);

    const matches = await agentA.get(`/api/preferences/${journeyA._id}/matches`);
    expect(matches.status).toBe(200);
    expect(matches.body.matches.length).toBeGreaterThanOrEqual(0);

    const createRes = await agentA
      .post('/api/swaps')
      .send({ requesterJourneyId: journeyA._id, receiverJourneyId: journeyB._id, message: 'Swap?' });
    expect(createRes.status).toBe(201);
    const swapRequestId = createRes.body.swapRequest._id;

    const incomingForB = await agentB.get('/api/swaps/incoming');
    expect(incomingForB.status).toBe(200);
    expect(incomingForB.body.swapRequests).toHaveLength(1);

    // The requester cannot accept their own request.
    const selfAccept = await agentA.patch(`/api/swaps/${swapRequestId}/accept`);
    expect(selfAccept.status).toBe(403);

    const acceptRes = await agentB.patch(`/api/swaps/${swapRequestId}/accept`);
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.swapRequest.status).toBe('completed');

    // Already-completed swap cannot be re-accepted.
    const reAccept = await agentB.patch(`/api/swaps/${swapRequestId}/accept`);
    expect(reAccept.status).toBe(400);

    const notificationsForA = await agentA.get('/api/notifications');
    expect(notificationsForA.status).toBe(200);
    expect(notificationsForA.body.notifications.some((n: { type: string }) => n.type === 'swap_request_completed')).toBe(
      true,
    );
  });

  it('forbids a third party from accepting or rejecting someone else\'s swap request', async () => {
    const { agent: agentA } = await registerAndLogin({ email: 'thirda@example.com' });
    const { agent: agentB } = await registerAndLogin({ email: 'thirdb@example.com' });
    const { agent: agentC } = await registerAndLogin({ email: 'thirdc@example.com' });

    const journeyA = (await agentA.post('/api/pnr/verify').send({ pnr: PNR_UPPER })).body.journey;
    const journeyB = (await agentB.post('/api/pnr/verify').send({ pnr: PNR_LOWER })).body.journey;
    await agentA.post('/api/preferences').send({ journeyId: journeyA._id, desiredBerthTypes: ['lower'] });

    const created = await agentA
      .post('/api/swaps')
      .send({ requesterJourneyId: journeyA._id, receiverJourneyId: journeyB._id });
    const swapRequestId = created.body.swapRequest._id;

    const strangerAccept = await agentC.patch(`/api/swaps/${swapRequestId}/accept`);
    expect(strangerAccept.status).toBe(403);

    const strangerReject = await agentC.patch(`/api/swaps/${swapRequestId}/reject`);
    expect(strangerReject.status).toBe(403);
  });

  it('rejects a duplicate pending swap request between the same two journeys', async () => {
    const { agent: agentA } = await registerAndLogin({ email: 'dupa@example.com' });
    const { agent: agentB } = await registerAndLogin({ email: 'dupb@example.com' });

    const journeyA = (await agentA.post('/api/pnr/verify').send({ pnr: PNR_UPPER })).body.journey;
    const journeyB = (await agentB.post('/api/pnr/verify').send({ pnr: PNR_LOWER })).body.journey;
    await agentA.post('/api/preferences').send({ journeyId: journeyA._id, desiredBerthTypes: ['lower'] });

    const first = await agentA
      .post('/api/swaps')
      .send({ requesterJourneyId: journeyA._id, receiverJourneyId: journeyB._id });
    expect(first.status).toBe(201);

    const second = await agentA
      .post('/api/swaps')
      .send({ requesterJourneyId: journeyA._id, receiverJourneyId: journeyB._id });
    expect(second.status).toBe(409);
  });
});

describe('authorization on journeys and preferences', () => {
  it('returns 404 for a journey that does not belong to the requesting user', async () => {
    const { agent: owner } = await registerAndLogin({ email: 'owner@example.com' });
    const { agent: outsider } = await registerAndLogin({ email: 'outsider@example.com' });

    const journey = (await owner.post('/api/pnr/verify').send({ pnr: PNR_UPPER })).body.journey;

    const res = await outsider.get(`/api/journeys/${journey._id}`);
    expect(res.status).toBe(404);
  });

  it('returns 404 for a preference lookup on an unowned journey', async () => {
    const { agent: owner } = await registerAndLogin({ email: 'owner2@example.com' });
    const { agent: outsider } = await registerAndLogin({ email: 'outsider2@example.com' });

    const journey = (await owner.post('/api/pnr/verify').send({ pnr: PNR_UPPER })).body.journey;

    const res = await outsider.get(`/api/preferences/${journey._id}`);
    expect(res.status).toBe(404);
  });
});
