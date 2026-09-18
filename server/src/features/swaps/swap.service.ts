import mongoose from 'mongoose';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors';
import { JourneyModel, type JourneyDocument } from '../journeys/journey.model';
import { getOwnedJourneyOrThrow } from '../journeys/journey.service';
import { createNotification } from '../notifications/notification.service';
import { getPreferenceForJourney } from '../preferences/preference.service';
import { SwapPreferenceModel } from '../preferences/swapPreference.model';
import { SwapRequestModel, type SwapRequestDocument } from './swapRequest.model';

const SWAP_REQUEST_TTL_DAYS = 3;

const SWAP_REQUEST_POPULATE = [
  { path: 'requesterId', select: 'name' },
  { path: 'requesterJourneyId' },
  { path: 'receiverId', select: 'name' },
  { path: 'receiverJourneyId' },
];

interface SeatSnapshot {
  coach?: string | null;
  seatNumber: string;
  berthType: string;
}

function seatsMatch(a: SeatSnapshot, b: SeatSnapshot): boolean {
  return (a.coach ?? null) === (b.coach ?? null) && a.seatNumber === b.seatNumber && a.berthType === b.berthType;
}

// Rule 3: both journeys must be compatible — same train/flight, date, and class.
function assertJourneysCompatible(a: JourneyDocument, b: JourneyDocument): void {
  if (
    a.transportType !== b.transportType ||
    a.vehicleNumber !== b.vehicleNumber ||
    a.travelDate.getTime() !== b.travelDate.getTime() ||
    a.class !== b.class
  ) {
    throw new BadRequestError(
      'These journeys are not compatible for a swap (different train/flight, date, or class)',
    );
  }
}

// Rule 4: a user cannot have a conflicting active request for the same pair of journeys.
async function assertNoConflictingActiveRequest(journeyIdA: string, journeyIdB: string): Promise<void> {
  const existing = await SwapRequestModel.findOne({
    status: 'pending',
    $or: [
      { requesterJourneyId: journeyIdA, receiverJourneyId: journeyIdB },
      { requesterJourneyId: journeyIdB, receiverJourneyId: journeyIdA },
    ],
  });
  if (existing) {
    throw new ConflictError('A pending swap request already exists between these journeys');
  }
}

// Rule 7: expired requests cannot be accepted/rejected — lazily flip a
// pending request whose TTL has passed the first time anyone touches it.
async function expireIfNeeded(swapRequest: SwapRequestDocument): Promise<SwapRequestDocument> {
  if (swapRequest.status === 'pending' && swapRequest.expiresAt.getTime() < Date.now()) {
    swapRequest.status = 'expired';
    swapRequest.respondedAt = new Date();
    await swapRequest.save();
  }
  return swapRequest;
}

async function getSwapRequestOrThrow(swapRequestId: string): Promise<SwapRequestDocument> {
  const swapRequest = await SwapRequestModel.findById(swapRequestId);
  if (!swapRequest) {
    throw new NotFoundError('Swap request not found');
  }
  return swapRequest;
}

export async function createSwapRequest(
  requesterUserId: string,
  requesterJourneyId: string,
  receiverJourneyId: string,
  message: string | undefined,
): Promise<SwapRequestDocument> {
  const requesterJourney = await getOwnedJourneyOrThrow(requesterUserId, requesterJourneyId);
  if (requesterJourney.status !== 'active') {
    throw new BadRequestError('Your journey is no longer active');
  }

  const receiverJourney = await JourneyModel.findById(receiverJourneyId);
  if (!receiverJourney || receiverJourney.status !== 'active') {
    throw new NotFoundError('Target journey not found');
  }

  // Rule 1: no self-requests.
  if (receiverJourney.userId.toString() === requesterUserId) {
    throw new BadRequestError('You cannot send a swap request to yourself');
  }

  // Rule 2: both journeys must be verified — guaranteed here, since
  // getOwnedJourneyOrThrow only returns a real, previously PNR-verified
  // journey, and receiverJourney's existence + active status is checked above.

  // Rule 3: journeys must be compatible.
  assertJourneysCompatible(requesterJourney, receiverJourney);

  const requesterPreference = await getPreferenceForJourney(requesterJourneyId);
  if (!requesterPreference || requesterPreference.status !== 'active') {
    throw new BadRequestError('Set your seat preference before requesting a swap');
  }
  if (!requesterPreference.desiredBerthTypes.includes(receiverJourney.assignedSeat.berthType)) {
    throw new BadRequestError('This seat does not match your stated preference');
  }

  // Rule 4: no conflicting active request for this exact journey pair.
  await assertNoConflictingActiveRequest(requesterJourneyId, receiverJourneyId);

  const expiresAt = new Date(Date.now() + SWAP_REQUEST_TTL_DAYS * 24 * 60 * 60 * 1000);

  const swapRequest = await SwapRequestModel.create({
    requesterId: requesterUserId,
    receiverId: receiverJourney.userId,
    requesterJourneyId,
    receiverJourneyId,
    requesterSeat: requesterJourney.assignedSeat,
    receiverSeat: receiverJourney.assignedSeat,
    message,
    status: 'pending',
    expiresAt,
  });

  await createNotification({
    userId: receiverJourney.userId.toString(),
    type: 'swap_request_received',
    title: 'New seat swap request',
    message: `${requesterJourney.operatorName} · seat ${requesterJourney.assignedSeat.seatNumber} is offered to you for a swap.`,
    relatedSwapRequestId: swapRequest._id.toString(),
  });

  return swapRequest;
}

// Flips any of this user's pending requests past their expiresAt to
// 'expired' before listing, so a stale request is never shown with live
// Accept/Decline actions — the client always sees an accurate status
// without first having to try (and fail) to act on it.
async function expireStaleRequestsMatching(filter: Record<string, unknown>): Promise<void> {
  await SwapRequestModel.updateMany(
    { ...filter, status: 'pending', expiresAt: { $lt: new Date() } },
    { status: 'expired', respondedAt: new Date() },
  );
}

export async function listIncomingForUser(userId: string): Promise<SwapRequestDocument[]> {
  await expireStaleRequestsMatching({ receiverId: userId });
  return SwapRequestModel.find({ receiverId: userId })
    .sort({ createdAt: -1 })
    .populate(SWAP_REQUEST_POPULATE);
}

export async function listOutgoingForUser(userId: string): Promise<SwapRequestDocument[]> {
  await expireStaleRequestsMatching({ requesterId: userId });
  return SwapRequestModel.find({ requesterId: userId })
    .sort({ createdAt: -1 })
    .populate(SWAP_REQUEST_POPULATE);
}

async function cancelOtherPendingRequestsForJourneys(
  journeyIds: string[],
  excludeSwapRequestId: string,
  session: mongoose.ClientSession,
): Promise<{ counterpartUserId: string; swapRequestId: string }[]> {
  const otherPending = await SwapRequestModel.find({
    _id: { $ne: excludeSwapRequestId },
    status: 'pending',
    $or: [{ requesterJourneyId: { $in: journeyIds } }, { receiverJourneyId: { $in: journeyIds } }],
  }).session(session);

  const bumped: { counterpartUserId: string; swapRequestId: string }[] = [];

  for (const request of otherPending) {
    request.status = 'cancelled';
    request.respondedAt = new Date();
    await request.save({ session });

    const counterpartUserId = journeyIds.includes(request.requesterJourneyId.toString())
      ? request.receiverId.toString()
      : request.requesterId.toString();

    bumped.push({ counterpartUserId, swapRequestId: request._id.toString() });
  }

  return bumped;
}

export async function acceptSwapRequest(
  userId: string,
  swapRequestId: string,
): Promise<SwapRequestDocument> {
  let swapRequest = await getSwapRequestOrThrow(swapRequestId);

  // Rule 8: only the receiver can accept.
  if (swapRequest.receiverId.toString() !== userId) {
    throw new ForbiddenError('You are not the recipient of this swap request');
  }

  // Rules 5, 6 & 7: no double-accept, no accepting a resolved/expired request.
  swapRequest = await expireIfNeeded(swapRequest);
  if (swapRequest.status !== 'pending') {
    throw new BadRequestError(
      swapRequest.status === 'expired'
        ? 'This swap request has expired'
        : 'This swap request has already been responded to',
    );
  }

  const session = await mongoose.startSession();
  let bumped: { counterpartUserId: string; swapRequestId: string }[] = [];

  try {
    await session.withTransaction(async () => {
      // Re-fetch and re-check status *inside* the transaction, under this
      // session's snapshot. Two concurrent accept attempts could both pass
      // the pending-check above before either commits; this closes that
      // window explicitly rather than relying only on the seat-snapshot
      // check below to incidentally catch it via a write conflict + retry.
      const freshSwapRequest = await SwapRequestModel.findById(swapRequestId).session(session);
      if (!freshSwapRequest || freshSwapRequest.status !== 'pending') {
        throw new ConflictError('This swap request has already been responded to');
      }
      swapRequest = freshSwapRequest;

      const requesterJourney = await JourneyModel.findById(swapRequest.requesterJourneyId).session(
        session,
      );
      const receiverJourney = await JourneyModel.findById(swapRequest.receiverJourneyId).session(
        session,
      );
      if (!requesterJourney || !receiverJourney) {
        throw new NotFoundError('One of the journeys in this request no longer exists');
      }

      // Rule 10: validate the current seat state before completing the
      // swap — guards against either seat having changed since this
      // request was created (e.g. via a different accepted swap).
      if (
        !seatsMatch(requesterJourney.assignedSeat, swapRequest.requesterSeat) ||
        !seatsMatch(receiverJourney.assignedSeat, swapRequest.receiverSeat)
      ) {
        throw new ConflictError(
          'One of the seats in this request has changed since it was sent and can no longer be swapped',
        );
      }

      // Application-level seat swap only — this does NOT change any official
      // railway/airline reservation. See architecture.md for the distinction.
      const requesterSeat = requesterJourney.assignedSeat;
      requesterJourney.assignedSeat = receiverJourney.assignedSeat;
      receiverJourney.assignedSeat = requesterSeat;
      await requesterJourney.save({ session });
      await receiverJourney.save({ session });

      await SwapPreferenceModel.updateMany(
        { journeyId: { $in: [requesterJourney._id, receiverJourney._id] } },
        { status: 'matched' },
        { session },
      );

      swapRequest.status = 'completed';
      swapRequest.respondedAt = new Date();
      await swapRequest.save({ session });

      bumped = await cancelOtherPendingRequestsForJourneys(
        [requesterJourney._id.toString(), receiverJourney._id.toString()],
        swapRequest._id.toString(),
        session,
      );
    });
  } finally {
    await session.endSession();
  }

  await createNotification({
    userId: swapRequest.requesterId.toString(),
    type: 'swap_request_completed',
    title: 'Swap completed',
    message: 'Your seat swap request was accepted and completed — check your updated seat details.',
    relatedSwapRequestId: swapRequest._id.toString(),
  });

  for (const { counterpartUserId, swapRequestId: bumpedId } of bumped) {
    await createNotification({
      userId: counterpartUserId,
      type: 'swap_request_cancelled',
      title: 'Swap request cancelled',
      message: 'One of the seats in this request was swapped through another request.',
      relatedSwapRequestId: bumpedId,
    });
  }

  return swapRequest.populate(SWAP_REQUEST_POPULATE);
}

export async function rejectSwapRequest(
  userId: string,
  swapRequestId: string,
): Promise<SwapRequestDocument> {
  let swapRequest = await getSwapRequestOrThrow(swapRequestId);

  // Rule 8: only the receiver can reject.
  if (swapRequest.receiverId.toString() !== userId) {
    throw new ForbiddenError('You are not the recipient of this swap request');
  }

  swapRequest = await expireIfNeeded(swapRequest);
  if (swapRequest.status !== 'pending') {
    throw new BadRequestError(
      swapRequest.status === 'expired'
        ? 'This swap request has expired'
        : 'This swap request has already been responded to',
    );
  }

  swapRequest.status = 'rejected';
  swapRequest.respondedAt = new Date();
  await swapRequest.save();

  await createNotification({
    userId: swapRequest.requesterId.toString(),
    type: 'swap_request_rejected',
    title: 'Swap request declined',
    message: 'Your seat swap request was declined.',
    relatedSwapRequestId: swapRequest._id.toString(),
  });

  return swapRequest.populate(SWAP_REQUEST_POPULATE);
}

export async function cancelSwapRequest(
  userId: string,
  swapRequestId: string,
): Promise<SwapRequestDocument> {
  let swapRequest = await getSwapRequestOrThrow(swapRequestId);

  // Rule 9: only the requester can cancel.
  if (swapRequest.requesterId.toString() !== userId) {
    throw new ForbiddenError('Only the requester can cancel this swap request');
  }

  swapRequest = await expireIfNeeded(swapRequest);
  if (swapRequest.status !== 'pending') {
    throw new BadRequestError(
      swapRequest.status === 'expired'
        ? 'This swap request has already expired'
        : 'This swap request can no longer be cancelled',
    );
  }

  swapRequest.status = 'cancelled';
  swapRequest.respondedAt = new Date();
  await swapRequest.save();

  await createNotification({
    userId: swapRequest.receiverId.toString(),
    type: 'swap_request_cancelled',
    title: 'Swap request withdrawn',
    message: 'The other passenger withdrew their swap request.',
    relatedSwapRequestId: swapRequest._id.toString(),
  });

  return swapRequest.populate(SWAP_REQUEST_POPULATE);
}
