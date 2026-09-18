import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { NOTIFICATION_TYPES } from '../../types/domain';

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true, enum: NOTIFICATION_TYPES },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedSwapRequestId: { type: Schema.Types.ObjectId, ref: 'SwapRequest' },
    read: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

// listNotificationsForUser: sorted list, most recent first.
notificationSchema.index({ userId: 1, createdAt: -1 });
// getUnreadCount / markAllNotificationsRead: filtered on {userId, read}.
notificationSchema.index({ userId: 1, read: 1 });

export type NotificationDocument = HydratedDocument<InferSchemaType<typeof notificationSchema>>;

export const NotificationModel = model('Notification', notificationSchema);
