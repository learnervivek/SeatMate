export const TRANSPORT_TYPES = ['train', 'flight'] as const;
export type TransportType = (typeof TRANSPORT_TYPES)[number];

export const TRAIN_BERTH_TYPES = ['lower', 'middle', 'upper', 'side-lower', 'side-upper'] as const;
export const FLIGHT_SEAT_TYPES = ['window', 'middle', 'aisle'] as const;
export const BERTH_TYPES = [...TRAIN_BERTH_TYPES, ...FLIGHT_SEAT_TYPES] as const;
export type BerthType = (typeof BERTH_TYPES)[number];

export function berthTypesForTransport(transportType: TransportType): readonly BerthType[] {
  return transportType === 'train' ? TRAIN_BERTH_TYPES : FLIGHT_SEAT_TYPES;
}

export const BERTH_LABELS: Record<BerthType, string> = {
  lower: 'Lower berth',
  middle: 'Middle berth',
  upper: 'Upper berth',
  'side-lower': 'Side lower berth',
  'side-upper': 'Side upper berth',
  window: 'Window seat',
  aisle: 'Aisle seat',
};

export type SwapRequestStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'expired'
  | 'completed';
export type SeatPreferenceStatus = 'active' | 'matched' | 'cancelled';
export type NotificationType =
  | 'swap_request_received'
  | 'swap_request_completed'
  | 'swap_request_rejected'
  | 'swap_request_cancelled';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AssignedSeat {
  coach?: string;
  seatNumber: string;
  berthType: BerthType;
}

export interface Journey {
  _id: string;
  userId: string;
  pnr: string;
  transportType: TransportType;
  operatorName: string;
  vehicleNumber: string;
  from: string;
  to: string;
  boardingStation?: string;
  travelDate: string;
  class: string;
  assignedSeat: AssignedSeat;
  status: 'active' | 'cancelled';
  verifiedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SeatRange {
  min: number;
  max: number;
}

export interface SwapPreference {
  _id: string;
  userId: string;
  journeyId: string;
  currentSeat: AssignedSeat;
  desiredBerthTypes: BerthType[];
  sameCoach: boolean;
  preferredSeatRange?: SeatRange;
  status: SeatPreferenceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SeatMatch {
  journeyId: string;
  passenger: { name: string };
  currentSeat: AssignedSeat;
  theirDesiredBerthTypes: BerthType[];
  score: number;
  reasons: string[];
}

export interface SwapRequest {
  _id: string;
  requesterId: string | { _id: string; name: string };
  receiverId: string | { _id: string; name: string };
  requesterJourneyId: string | Journey;
  receiverJourneyId: string | Journey;
  requesterSeat: AssignedSeat;
  receiverSeat: AssignedSeat;
  status: SwapRequestStatus;
  expiresAt: string;
  message?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedSwapRequestId?: string;
  read: boolean;
  createdAt: string;
}
