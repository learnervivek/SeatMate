import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { BERTH_TYPES, SEAT_PREFERENCE_STATUSES } from '../../types/domain';

const currentSeatSchema = new Schema(
  {
    coach: { type: String, trim: true },
    seatNumber: { type: String, required: true, trim: true },
    berthType: { type: String, required: true, enum: BERTH_TYPES },
  },
  { _id: false },
);

const seatRangeSchema = new Schema(
  {
    min: { type: Number, required: true, min: 1 },
    max: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const swapPreferenceSchema = new Schema(
  {
    journeyId: {
      type: Schema.Types.ObjectId,
      ref: 'Journey',
      required: true,
      unique: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Snapshot of the journey's seat at the time the preference was set/last
    // updated — kept distinct from Journey.assignedSeat so a preference
    // record stays historically accurate even after an accepted swap
    // changes the journey's actual seat.
    currentSeat: { type: currentSeatSchema, required: true },
    desiredBerthTypes: {
      type: [{ type: String, enum: BERTH_TYPES }],
      required: true,
      validate: {
        validator: (value: string[]) => value.length > 0,
        message: 'Select at least one desired seat/berth type',
      },
    },
    sameCoach: { type: Boolean, required: true, default: false },
    preferredSeatRange: { type: seatRangeSchema, required: false },
    status: {
      type: String,
      required: true,
      enum: SEAT_PREFERENCE_STATUSES,
      default: 'active',
    },
  },
  { timestamps: true },
);

swapPreferenceSchema.index({ status: 1, journeyId: 1 });

export type SwapPreferenceDocument = HydratedDocument<InferSchemaType<typeof swapPreferenceSchema>>;

export const SwapPreferenceModel = model('SwapPreference', swapPreferenceSchema);
