/**
 * MOCK PNR DATASET — development/demo data only.
 *
 * This is a mock PNR verification service for SeatMate. It is NOT connected
 * to Indian Railways, IRCTC, or any airline reservation system, and it does
 * not perform any live PNR lookup. It exists so this project can demonstrate
 * the "verify a journey" flow end to end. Several records intentionally
 * share the same train/flight + date + class so that seat-swap matching has
 * something to match against in a demo.
 *
 * Each record's `passengers` array models a real PNR status response (a
 * booking can cover more than one traveller). SeatMate treats the first
 * passenger on the PNR as the person verifying it — see
 * journey.service.ts for what actually gets persisted from this.
 */
import type { PNRLookupResult } from './pnr.types';

export const MOCK_PNR_RECORDS: readonly PNRLookupResult[] = [
  // Train 12301 — Rajdhani Express, NDLS -> HWH, 2026-10-05, class 3A
  {
    pnr: '2458761023',
    transportType: 'train',
    operatorName: 'Rajdhani Express',
    vehicleNumber: '12301',
    source: 'NDLS',
    destination: 'HWH',
    boardingStation: 'NDLS',
    journeyDate: '2026-10-05',
    class: '3A',
    passengers: [
      { name: 'Abhinav Shashank', age: 29, coach: 'B4', seatNumber: '32', berthType: 'side-upper', bookingStatus: 'CONFIRMED' },
    ],
  },
  {
    pnr: '2458761024',
    transportType: 'train',
    operatorName: 'Rajdhani Express',
    vehicleNumber: '12301',
    source: 'NDLS',
    destination: 'HWH',
    boardingStation: 'NDLS',
    journeyDate: '2026-10-05',
    class: '3A',
    passengers: [
      { name: 'Rohit Kapoor', age: 41, coach: 'B4', seatNumber: '18', berthType: 'lower', bookingStatus: 'CONFIRMED' },
    ],
  },
  {
    pnr: '2458761025',
    transportType: 'train',
    operatorName: 'Rajdhani Express',
    vehicleNumber: '12301',
    source: 'NDLS',
    destination: 'HWH',
    boardingStation: 'NDLS',
    journeyDate: '2026-10-05',
    class: '3A',
    passengers: [
      { name: 'Neha Joshi', age: 34, coach: 'B4', seatNumber: '45', berthType: 'middle', bookingStatus: 'CONFIRMED' },
    ],
  },
  {
    pnr: '2458761026',
    transportType: 'train',
    operatorName: 'Rajdhani Express',
    vehicleNumber: '12301',
    source: 'NDLS',
    destination: 'HWH',
    boardingStation: 'NDLS',
    journeyDate: '2026-10-05',
    class: '3A',
    passengers: [
      { name: 'Vikram Nair', age: 37, coach: 'B5', seatNumber: '7', berthType: 'upper', bookingStatus: 'CONFIRMED' },
    ],
  },
  {
    pnr: '2458761027',
    transportType: 'train',
    operatorName: 'Rajdhani Express',
    vehicleNumber: '12301',
    source: 'NDLS',
    destination: 'HWH',
    boardingStation: 'NDLS',
    journeyDate: '2026-10-05',
    class: '3A',
    passengers: [
      { name: 'Priya Menon', age: 26, coach: 'B5', seatNumber: '61', berthType: 'side-lower', bookingStatus: 'CONFIRMED' },
    ],
  },

  // Train 12951 — Mumbai Rajdhani, BCT -> NDLS, 2026-10-08, class 2A
  // Passenger boards at Vadodara rather than the train's origin.
  {
    pnr: '3391045512',
    transportType: 'train',
    operatorName: 'Mumbai Rajdhani',
    vehicleNumber: '12951',
    source: 'BCT',
    destination: 'NDLS',
    boardingStation: 'BRC',
    journeyDate: '2026-10-08',
    class: '2A',
    passengers: [
      { name: 'Karan Malhotra', age: 45, coach: 'A1', seatNumber: '9', berthType: 'lower', bookingStatus: 'CONFIRMED' },
      { name: 'Simran Malhotra', age: 42, coach: 'A1', seatNumber: '10', berthType: 'upper', bookingStatus: 'CONFIRMED' },
    ],
  },
  {
    pnr: '3391045513',
    transportType: 'train',
    operatorName: 'Mumbai Rajdhani',
    vehicleNumber: '12951',
    source: 'BCT',
    destination: 'NDLS',
    boardingStation: 'BCT',
    journeyDate: '2026-10-08',
    class: '2A',
    passengers: [
      { name: 'Aditya Rao', age: 31, coach: 'A2', seatNumber: '21', berthType: 'side-upper', bookingStatus: 'CONFIRMED' },
    ],
  },

  // Train 12622 — Tamil Nadu Express, NDLS -> MAS, 2026-10-12, class SL
  // Matches the reference example: S4-72 Upper / S4-45 Lower / S4-61 Side Lower.
  {
    pnr: '4671829305',
    transportType: 'train',
    operatorName: 'Tamil Nadu Express',
    vehicleNumber: '12622',
    source: 'NDLS',
    destination: 'MAS',
    boardingStation: 'NDLS',
    journeyDate: '2026-10-12',
    class: 'SL',
    passengers: [
      { name: 'Arjun Mehta', age: 27, coach: 'S4', seatNumber: '72', berthType: 'upper', bookingStatus: 'CONFIRMED' },
    ],
  },
  {
    pnr: '4671829306',
    transportType: 'train',
    operatorName: 'Tamil Nadu Express',
    vehicleNumber: '12622',
    source: 'NDLS',
    destination: 'MAS',
    boardingStation: 'NDLS',
    journeyDate: '2026-10-12',
    class: 'SL',
    passengers: [
      { name: 'Divya Rao', age: 33, coach: 'S4', seatNumber: '45', berthType: 'lower', bookingStatus: 'CONFIRMED' },
    ],
  },
  {
    pnr: '4671829307',
    transportType: 'train',
    operatorName: 'Tamil Nadu Express',
    vehicleNumber: '12622',
    source: 'NDLS',
    destination: 'MAS',
    boardingStation: 'NDLS',
    journeyDate: '2026-10-12',
    class: 'SL',
    passengers: [
      { name: 'Kabir Singh', age: 39, coach: 'S4', seatNumber: '61', berthType: 'side-lower', bookingStatus: 'CONFIRMED' },
    ],
  },

  // Flight 6E-2341 — IndiGo, DEL -> BOM, 2026-10-06, Economy
  {
    pnr: 'FLT10293',
    transportType: 'flight',
    operatorName: 'IndiGo',
    vehicleNumber: '6E-2341',
    source: 'DEL',
    destination: 'BOM',
    boardingStation: 'DEL',
    journeyDate: '2026-10-06',
    class: 'Economy',
    passengers: [
      { name: 'Meera Iyer', age: 30, seatNumber: '14A', berthType: 'window', bookingStatus: 'CONFIRMED' },
    ],
  },
  {
    pnr: 'FLT10294',
    transportType: 'flight',
    operatorName: 'IndiGo',
    vehicleNumber: '6E-2341',
    source: 'DEL',
    destination: 'BOM',
    boardingStation: 'DEL',
    journeyDate: '2026-10-06',
    class: 'Economy',
    passengers: [
      { name: 'Farhan Ali', age: 28, seatNumber: '14B', berthType: 'middle', bookingStatus: 'CONFIRMED' },
    ],
  },
  {
    pnr: 'FLT10295',
    transportType: 'flight',
    operatorName: 'IndiGo',
    vehicleNumber: '6E-2341',
    source: 'DEL',
    destination: 'BOM',
    boardingStation: 'DEL',
    journeyDate: '2026-10-06',
    class: 'Economy',
    passengers: [
      { name: 'Ritika Desai', age: 25, seatNumber: '14C', berthType: 'aisle', bookingStatus: 'CONFIRMED' },
    ],
  },
  {
    pnr: 'FLT10296',
    transportType: 'flight',
    operatorName: 'IndiGo',
    vehicleNumber: '6E-2341',
    source: 'DEL',
    destination: 'BOM',
    boardingStation: 'DEL',
    journeyDate: '2026-10-06',
    class: 'Economy',
    passengers: [
      { name: 'Sameer Kulkarni', age: 36, seatNumber: '22F', berthType: 'window', bookingStatus: 'CONFIRMED' },
    ],
  },
] as const;
