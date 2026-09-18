import { ConflictError, NotFoundError } from '../../lib/errors';
import { pnrService } from '../pnr/pnrService';
import { JourneyModel, type JourneyDocument } from './journey.model';

export async function verifyPnrForUser(userId: string, pnr: string): Promise<JourneyDocument> {
  const normalizedPnr = pnr.trim().toUpperCase();

  const existing = await JourneyModel.findOne({ pnr: normalizedPnr });
  if (existing) {
    if (existing.userId.toString() === userId) {
      return existing;
    }
    throw new ConflictError('This PNR is already linked to another account');
  }

  const result = await pnrService.lookup(normalizedPnr);
  if (!result) {
    throw new NotFoundError(
      'PNR not found in the demo dataset. This is a mock PNR verification service for development/testing — it is not connected to Indian Railways, IRCTC, or any live reservation system.',
    );
  }

  const [self] = result.passengers;
  if (!self) {
    throw new NotFoundError('No passenger found on this PNR');
  }

  // SeatMate only persists what the app actually displays or uses for
  // matching. Passenger name/age and any co-passengers on the PNR are
  // intentionally dropped here rather than stored — this is demo journey
  // data, not a permanent record of the underlying booking.
  return JourneyModel.create({
    userId,
    pnr: result.pnr,
    transportType: result.transportType,
    operatorName: result.operatorName,
    vehicleNumber: result.vehicleNumber,
    from: result.source,
    to: result.destination,
    boardingStation: result.boardingStation,
    travelDate: new Date(result.journeyDate),
    class: result.class,
    assignedSeat: {
      coach: self.coach,
      seatNumber: self.seatNumber,
      berthType: self.berthType,
    },
  });
}

export async function listJourneysForUser(userId: string): Promise<JourneyDocument[]> {
  return JourneyModel.find({ userId, status: 'active' }).sort({ travelDate: 1 });
}

export async function getJourneyById(journeyId: string): Promise<JourneyDocument | null> {
  return JourneyModel.findById(journeyId);
}

export async function getOwnedJourneyOrThrow(
  userId: string,
  journeyId: string,
): Promise<JourneyDocument> {
  const journey = await JourneyModel.findOne({ _id: journeyId, userId });
  if (!journey) {
    throw new NotFoundError('Journey not found');
  }
  return journey;
}
