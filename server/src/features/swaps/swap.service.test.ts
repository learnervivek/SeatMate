import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../../test/db';
import { createCompatiblePair, createTestJourney, createTestPreference, createTestUser } from '../../test/factories';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors';
import { JourneyModel } from '../journeys/journey.model';
import { SwapPreferenceModel } from '../preferences/swapPreference.model';
import { NotificationModel } from '../notifications/notification.model';
import { SwapRequestModel } from './swapRequest.model';
import { acceptSwapRequest, cancelSwapRequest, createSwapRequest, rejectSwapRequest } from './swap.service';

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

async function setupCompatiblePair() {
  const { user: userA } = await createTestUser({ email: 'a@example.com' });
  const { user: userB } = await createTestUser({ email: 'b@example.com' });
  const { journeyA, journeyB } = await createCompatiblePair(userA._id.toString(), userB._id.toString());
  return { userA, userB, journeyA, journeyB };
}

describe('createSwapRequest', () => {
  it('creates a pending request with correct seat snapshots and a 3-day expiry', async () => {
    const { userA, journeyA, journeyB } = await setupCompatiblePair();

    const before = Date.now();
    const swapRequest = await createSwapRequest(
      userA._id.toString(),
      journeyA._id.toString(),
      journeyB._id.toString(),
      'Would you swap?',
    );

    expect(swapRequest.status).toBe('pending');
    expect(swapRequest.requesterSeat.seatNumber).toBe(journeyA.assignedSeat.seatNumber);
    expect(swapRequest.receiverSeat.seatNumber).toBe(journeyB.assignedSeat.seatNumber);
    const expiresInDays = (swapRequest.expiresAt.getTime() - before) / (24 * 60 * 60 * 1000);
    expect(expiresInDays).toBeGreaterThan(2.9);
    expect(expiresInDays).toBeLessThan(3.1);
  });

  it('notifies the receiver', async () => {
    const { userA, userB, journeyA, journeyB } = await setupCompatiblePair();

    await createSwapRequest(userA._id.toString(), journeyA._id.toString(), journeyB._id.toString(), undefined);

    const notifications = await NotificationModel.find({ userId: userB._id });
    expect(notifications).toHaveLength(1);
    expect(notifications[0]!.type).toBe('swap_request_received');
  });

  it('rejects a request to your own second journey (no self-swaps)', async () => {
    const { user } = await createTestUser();
    const journeyA = await createTestJourney(user._id.toString(), {
      vehicleNumber: '12301',
      travelDate: new Date('2027-03-01T00:00:00.000Z'),
      class: '3A',
      assignedSeat: { coach: 'B4', seatNumber: '10', berthType: 'upper' },
    });
    const journeyB = await createTestJourney(user._id.toString(), {
      vehicleNumber: '12301',
      travelDate: new Date('2027-03-01T00:00:00.000Z'),
      class: '3A',
      assignedSeat: { coach: 'B4', seatNumber: '20', berthType: 'lower' },
    });
    await createTestPreference(user._id.toString(), journeyA, ['lower']);

    await expect(
      createSwapRequest(user._id.toString(), journeyA._id.toString(), journeyB._id.toString(), undefined),
    ).rejects.toThrow(BadRequestError);
  });

  it('rejects journeys that are not compatible (different train)', async () => {
    const { user: userA } = await createTestUser({ email: 'a@example.com' });
    const { user: userB } = await createTestUser({ email: 'b@example.com' });
    const journeyA = await createTestJourney(userA._id.toString(), {
      vehicleNumber: '12301',
      assignedSeat: { coach: 'B4', seatNumber: '10', berthType: 'upper' },
    });
    const journeyB = await createTestJourney(userB._id.toString(), {
      vehicleNumber: '99999',
      assignedSeat: { coach: 'B4', seatNumber: '20', berthType: 'lower' },
    });
    await createTestPreference(userA._id.toString(), journeyA, ['lower']);

    await expect(
      createSwapRequest(userA._id.toString(), journeyA._id.toString(), journeyB._id.toString(), undefined),
    ).rejects.toThrow(BadRequestError);
  });

  it('rejects when the requester has not set a seat preference', async () => {
    const { userA, journeyA, journeyB } = await setupCompatiblePair();
    await SwapPreferenceModel.deleteMany({ journeyId: journeyA._id });

    await expect(
      createSwapRequest(userA._id.toString(), journeyA._id.toString(), journeyB._id.toString(), undefined),
    ).rejects.toThrow(BadRequestError);
  });

  it('rejects when the receiver seat does not match the requester preference', async () => {
    const { userA, journeyA, journeyB } = await setupCompatiblePair();
    // Requester now only wants a middle berth, but the receiver's seat is lower.
    await SwapPreferenceModel.updateOne({ journeyId: journeyA._id }, { desiredBerthTypes: ['middle'] });

    await expect(
      createSwapRequest(userA._id.toString(), journeyA._id.toString(), journeyB._id.toString(), undefined),
    ).rejects.toThrow(BadRequestError);
  });

  it('rejects an unavailable (cancelled) receiver journey', async () => {
    const { userA, journeyA, journeyB } = await setupCompatiblePair();
    await JourneyModel.updateOne({ _id: journeyB._id }, { status: 'cancelled' });

    await expect(
      createSwapRequest(userA._id.toString(), journeyA._id.toString(), journeyB._id.toString(), undefined),
    ).rejects.toThrow(NotFoundError);
  });

  it('rejects a duplicate pending request for the same journey pair', async () => {
    const { userA, journeyA, journeyB } = await setupCompatiblePair();
    await createSwapRequest(userA._id.toString(), journeyA._id.toString(), journeyB._id.toString(), undefined);

    await expect(
      createSwapRequest(userA._id.toString(), journeyA._id.toString(), journeyB._id.toString(), undefined),
    ).rejects.toThrow(ConflictError);
  });
});

describe('two users requesting the same passenger', () => {
  it('cancels the loser automatically when the receiver accepts one request', async () => {
    const { user: userA } = await createTestUser({ email: 'a@example.com' });
    const { user: userB } = await createTestUser({ email: 'b@example.com' });
    const { user: userC } = await createTestUser({ email: 'c@example.com' });

    const journeyC = await createTestJourney(userC._id.toString(), {
      vehicleNumber: '12301',
      travelDate: new Date('2027-03-01T00:00:00.000Z'),
      class: '3A',
      assignedSeat: { coach: 'B4', seatNumber: '30', berthType: 'lower' },
    });
    const journeyA = await createTestJourney(userA._id.toString(), {
      vehicleNumber: '12301',
      travelDate: new Date('2027-03-01T00:00:00.000Z'),
      class: '3A',
      assignedSeat: { coach: 'B4', seatNumber: '31', berthType: 'upper' },
    });
    const journeyB = await createTestJourney(userB._id.toString(), {
      vehicleNumber: '12301',
      travelDate: new Date('2027-03-01T00:00:00.000Z'),
      class: '3A',
      assignedSeat: { coach: 'B4', seatNumber: '32', berthType: 'upper' },
    });
    await createTestPreference(userA._id.toString(), journeyA, ['lower']);
    await createTestPreference(userB._id.toString(), journeyB, ['lower']);

    const requestFromA = await createSwapRequest(
      userA._id.toString(),
      journeyA._id.toString(),
      journeyC._id.toString(),
      undefined,
    );
    const requestFromB = await createSwapRequest(
      userB._id.toString(),
      journeyB._id.toString(),
      journeyC._id.toString(),
      undefined,
    );

    await acceptSwapRequest(userC._id.toString(), requestFromA._id.toString());

    const loser = await SwapRequestModel.findById(requestFromB._id);
    expect(loser!.status).toBe('cancelled');

    const cancelNotification = await NotificationModel.findOne({
      userId: userB._id,
      type: 'swap_request_cancelled',
    });
    expect(cancelNotification).not.toBeNull();
  });
});

describe('acceptSwapRequest', () => {
  it('swaps the seats, marks the request completed, and marks preferences matched', async () => {
    const { userA, userB, journeyA, journeyB } = await setupCompatiblePair();
    const swapRequest = await createSwapRequest(
      userA._id.toString(),
      journeyA._id.toString(),
      journeyB._id.toString(),
      undefined,
    );

    const originalASeat = journeyA.assignedSeat.seatNumber;
    const originalBSeat = journeyB.assignedSeat.seatNumber;

    const accepted = await acceptSwapRequest(userB._id.toString(), swapRequest._id.toString());
    expect(accepted.status).toBe('completed');

    const freshA = await JourneyModel.findById(journeyA._id);
    const freshB = await JourneyModel.findById(journeyB._id);
    expect(freshA!.assignedSeat.seatNumber).toBe(originalBSeat);
    expect(freshB!.assignedSeat.seatNumber).toBe(originalASeat);

    const prefs = await SwapPreferenceModel.find({ journeyId: { $in: [journeyA._id, journeyB._id] } });
    expect(prefs.every((p) => p.status === 'matched')).toBe(true);

    const completedNotification = await NotificationModel.findOne({
      userId: userA._id,
      type: 'swap_request_completed',
    });
    expect(completedNotification).not.toBeNull();
  });

  it('forbids the requester from accepting their own outgoing request', async () => {
    const { userA, journeyA, journeyB } = await setupCompatiblePair();
    const swapRequest = await createSwapRequest(
      userA._id.toString(),
      journeyA._id.toString(),
      journeyB._id.toString(),
      undefined,
    );

    await expect(acceptSwapRequest(userA._id.toString(), swapRequest._id.toString())).rejects.toThrow(
      ForbiddenError,
    );
  });

  it('forbids an unrelated user from accepting', async () => {
    const { userA, journeyA, journeyB } = await setupCompatiblePair();
    const { user: stranger } = await createTestUser({ email: 'stranger@example.com' });
    const swapRequest = await createSwapRequest(
      userA._id.toString(),
      journeyA._id.toString(),
      journeyB._id.toString(),
      undefined,
    );

    await expect(acceptSwapRequest(stranger._id.toString(), swapRequest._id.toString())).rejects.toThrow(
      ForbiddenError,
    );
  });

  it('rejects accepting an already-completed swap', async () => {
    const { userA, userB, journeyA, journeyB } = await setupCompatiblePair();
    const swapRequest = await createSwapRequest(
      userA._id.toString(),
      journeyA._id.toString(),
      journeyB._id.toString(),
      undefined,
    );
    await acceptSwapRequest(userB._id.toString(), swapRequest._id.toString());

    await expect(acceptSwapRequest(userB._id.toString(), swapRequest._id.toString())).rejects.toThrow(
      BadRequestError,
    );
  });

  it('rejects and expires an accept attempt past the expiry', async () => {
    const { userA, userB, journeyA, journeyB } = await setupCompatiblePair();
    const swapRequest = await createSwapRequest(
      userA._id.toString(),
      journeyA._id.toString(),
      journeyB._id.toString(),
      undefined,
    );
    await SwapRequestModel.updateOne({ _id: swapRequest._id }, { expiresAt: new Date(Date.now() - 1000) });

    await expect(acceptSwapRequest(userB._id.toString(), swapRequest._id.toString())).rejects.toThrow(
      BadRequestError,
    );

    const fresh = await SwapRequestModel.findById(swapRequest._id);
    expect(fresh!.status).toBe('expired');
  });

  it('lets only one side win under concurrent accept attempts', async () => {
    const { userA, userB, journeyA, journeyB } = await setupCompatiblePair();
    const swapRequest = await createSwapRequest(
      userA._id.toString(),
      journeyA._id.toString(),
      journeyB._id.toString(),
      undefined,
    );

    const results = await Promise.allSettled([
      acceptSwapRequest(userB._id.toString(), swapRequest._id.toString()),
      acceptSwapRequest(userB._id.toString(), swapRequest._id.toString()),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const fresh = await SwapRequestModel.findById(swapRequest._id);
    expect(fresh!.status).toBe('completed');

    // The seats must have been swapped exactly once, not twice (which would
    // have swapped them back to their original values).
    const freshA = await JourneyModel.findById(journeyA._id);
    expect(freshA!.assignedSeat.seatNumber).toBe(journeyB.assignedSeat.seatNumber);
  });
});

describe('rejectSwapRequest', () => {
  it('marks the request rejected and notifies the requester', async () => {
    const { userA, userB, journeyA, journeyB } = await setupCompatiblePair();
    const swapRequest = await createSwapRequest(
      userA._id.toString(),
      journeyA._id.toString(),
      journeyB._id.toString(),
      undefined,
    );

    const rejected = await rejectSwapRequest(userB._id.toString(), swapRequest._id.toString());
    expect(rejected.status).toBe('rejected');

    const notification = await NotificationModel.findOne({ userId: userA._id, type: 'swap_request_rejected' });
    expect(notification).not.toBeNull();
  });

  it('forbids a non-receiver from rejecting', async () => {
    const { userA, journeyA, journeyB } = await setupCompatiblePair();
    const swapRequest = await createSwapRequest(
      userA._id.toString(),
      journeyA._id.toString(),
      journeyB._id.toString(),
      undefined,
    );

    await expect(rejectSwapRequest(userA._id.toString(), swapRequest._id.toString())).rejects.toThrow(
      ForbiddenError,
    );
  });

  it('rejects acting on an already-responded-to request', async () => {
    const { userA, userB, journeyA, journeyB } = await setupCompatiblePair();
    const swapRequest = await createSwapRequest(
      userA._id.toString(),
      journeyA._id.toString(),
      journeyB._id.toString(),
      undefined,
    );
    await rejectSwapRequest(userB._id.toString(), swapRequest._id.toString());

    await expect(rejectSwapRequest(userB._id.toString(), swapRequest._id.toString())).rejects.toThrow(
      BadRequestError,
    );
  });
});

describe('cancelSwapRequest', () => {
  it('marks the request cancelled and notifies the receiver', async () => {
    const { userA, userB, journeyA, journeyB } = await setupCompatiblePair();
    const swapRequest = await createSwapRequest(
      userA._id.toString(),
      journeyA._id.toString(),
      journeyB._id.toString(),
      undefined,
    );

    const cancelled = await cancelSwapRequest(userA._id.toString(), swapRequest._id.toString());
    expect(cancelled.status).toBe('cancelled');

    const notification = await NotificationModel.findOne({ userId: userB._id, type: 'swap_request_cancelled' });
    expect(notification).not.toBeNull();
  });

  it('forbids a non-requester from cancelling', async () => {
    const { userA, userB, journeyA, journeyB } = await setupCompatiblePair();
    const swapRequest = await createSwapRequest(
      userA._id.toString(),
      journeyA._id.toString(),
      journeyB._id.toString(),
      undefined,
    );

    await expect(cancelSwapRequest(userB._id.toString(), swapRequest._id.toString())).rejects.toThrow(
      ForbiddenError,
    );
  });
});
