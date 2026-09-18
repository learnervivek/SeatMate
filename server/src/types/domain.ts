export const TRANSPORT_TYPES = ['train', 'flight'] as const;
export type TransportType = (typeof TRANSPORT_TYPES)[number];

export const TRAIN_BERTH_TYPES = [
  'lower',
  'middle',
  'upper',
  'side-lower',
  'side-upper',
] as const;

export const FLIGHT_SEAT_TYPES = ['window', 'middle', 'aisle'] as const;

export const BERTH_TYPES = [...TRAIN_BERTH_TYPES, ...FLIGHT_SEAT_TYPES] as const;
export type BerthType = (typeof BERTH_TYPES)[number];

export function berthTypesForTransport(transportType: TransportType): readonly BerthType[] {
  return transportType === 'train' ? TRAIN_BERTH_TYPES : FLIGHT_SEAT_TYPES;
}

export const JOURNEY_STATUSES = ['active', 'cancelled'] as const;
export type JourneyStatus = (typeof JOURNEY_STATUSES)[number];

export const SEAT_PREFERENCE_STATUSES = ['active', 'matched', 'cancelled'] as const;
export type SeatPreferenceStatus = (typeof SEAT_PREFERENCE_STATUSES)[number];

export const SWAP_REQUEST_STATUSES = [
  'pending',
  'accepted',
  'rejected',
  'cancelled',
  'expired',
  'completed',
] as const;
export type SwapRequestStatus = (typeof SWAP_REQUEST_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  'swap_request_received',
  'swap_request_completed',
  'swap_request_rejected',
  'swap_request_cancelled',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
