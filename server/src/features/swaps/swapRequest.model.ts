import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { BERTH_TYPES, SWAP_REQUEST_STATUSES } from '../../types/domain';

const seatSnapshotSchema = new Schema(
  {
    coach: { type: String, trim: true },
    seatNumber: { type: String, required: true, trim: true },
    berthType: { type: String, required: true, enum: BERTH_TYPES },
  },
  { _id: false },
);

const swapRequestSchema = new Schema(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    requesterJourneyId: { type: Schema.Types.ObjectId, ref: 'Journey', required: true },
    receiverJourneyId: { type: Schema.Types.ObjectId, ref: 'Journey', required: true },
    // Snapshots of each side's seat at request-creation time — used to
    // detect, at accept time, whether either seat has since changed (e.g.
    // via a different accepted swap) before applying this one.
    requesterSeat: { type: seatSnapshotSchema, required: true },
    receiverSeat: { type: seatSnapshotSchema, required: true },
    status: {
      type: String,
      required: true,
      enum: SWAP_REQUEST_STATUSES,
      default: 'pending',
    },
    expiresAt: { type: Date, required: true },
    message: { type: String, trim: true, maxlength: 280 },
    respondedAt: { type: Date },
  },
  { timestamps: true },
);

// expireStaleRequestsMatching filters on {requesterId|receiverId, status:
// 'pending', expiresAt}; assertNoConflictingActiveRequest and
// cancelOtherPendingRequestsForJourneys filter on the journey-id variants.
swapRequestSchema.index({ requesterId: 1, status: 1 });
swapRequestSchema.index({ receiverId: 1, status: 1 });
swapRequestSchema.index({ requesterJourneyId: 1, status: 1 });
swapRequestSchema.index({ receiverJourneyId: 1, status: 1 });

// listIncomingForUser / listOutgoingForUser filter on {requesterId|
// receiverId} (no status filter — cancelled/expired/etc. all show) and sort
// by createdAt desc; these indexes let that sort come straight off the
// index instead of an in-memory sort on every dashboard load.
swapRequestSchema.index({ receiverId: 1, createdAt: -1 });
swapRequestSchema.index({ requesterId: 1, createdAt: -1 });

// DB-level backstop against duplicate pending requests for the same
// (requester journey, receiver journey) pair — the service layer already
// checks this before inserting, but that check-then-insert has a race
// window under concurrent requests; this index closes it at the database.
// Scoped to 'pending' only (a partial index) so journeys are free to swap
// again later via a fresh request once the old one resolves.
swapRequestSchema.index(
  { requesterJourneyId: 1, receiverJourneyId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } },
);

export type SwapRequestDocument = HydratedDocument<InferSchemaType<typeof swapRequestSchema>>;

export const SwapRequestModel = model('SwapRequest', swapRequestSchema);
