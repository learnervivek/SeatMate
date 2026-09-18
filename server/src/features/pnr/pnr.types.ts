import type { BerthType, TransportType } from '../../types/domain';

export interface PNRPassenger {
  name: string;
  age?: number;
  coach?: string;
  seatNumber: string;
  berthType: BerthType;
  bookingStatus: 'CONFIRMED';
}

/**
 * What a PNR provider returns for a lookup — modelled after a real PNR
 * status response (train/flight, route, boarding point, the full passenger
 * list on that booking). This is intentionally richer than what SeatMate
 * persists: see journey.service.ts for which fields actually get stored.
 */
export interface PNRLookupResult {
  pnr: string;
  transportType: TransportType;
  operatorName: string; // train name / airline name
  vehicleNumber: string; // train number / flight number
  source: string;
  destination: string;
  boardingStation: string;
  journeyDate: string; // ISO date (YYYY-MM-DD)
  class: string;
  passengers: PNRPassenger[];
}
