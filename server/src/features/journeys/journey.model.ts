import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { BERTH_TYPES, JOURNEY_STATUSES, TRANSPORT_TYPES } from '../../types/domain';

const assignedSeatSchema = new Schema(
  {
    coach: { type: String, trim: true },
    seatNumber: { type: String, required: true, trim: true },
    berthType: { type: String, required: true, enum: BERTH_TYPES },
  },
  { _id: false },
);

const journeySchema = new Schema(
  {
    // No standalone index here — the {userId, status, travelDate} compound
    // index below covers userId-only lookups via its prefix too.
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    pnr: { type: String, required: true, unique: true, trim: true, uppercase: true },
    transportType: { type: String, required: true, enum: TRANSPORT_TYPES },
    operatorName: { type: String, required: true, trim: true },
    vehicleNumber: { type: String, required: true, trim: true },
    from: { type: String, required: true, trim: true, uppercase: true },
    to: { type: String, required: true, trim: true, uppercase: true },
    boardingStation: { type: String, required: true, trim: true, uppercase: true },
    travelDate: { type: Date, required: true },
    class: { type: String, required: true, trim: true },
    assignedSeat: { type: assignedSeatSchema, required: true },
    status: { type: String, required: true, enum: JOURNEY_STATUSES, default: 'active' },
    verifiedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true },
);

// Matches matching.service.ts's candidate-journey lookup exactly (equality
// filters on all four fields), so it can be satisfied entirely from the
// index without a collection scan.
journeySchema.index({ vehicleNumber: 1, travelDate: 1, class: 1, status: 1 });

// listJourneysForUser filters on {userId, status} and sorts by travelDate —
// this index covers the filter and returns results pre-sorted, so Mongo
// never needs an in-memory sort for a user's journey list.
journeySchema.index({ userId: 1, status: 1, travelDate: 1 });

export type JourneyDocument = HydratedDocument<InferSchemaType<typeof journeySchema>>;

export const JourneyModel = model('Journey', journeySchema);
