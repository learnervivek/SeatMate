import bcrypt from 'bcryptjs';
import { UserModel, type UserDocument } from '../features/users/user.model';
import { JourneyModel, type JourneyDocument } from '../features/journeys/journey.model';
import {
  SwapPreferenceModel,
  type SwapPreferenceDocument,
} from '../features/preferences/swapPreference.model';
import type { BerthType, TransportType } from '../types/domain';

interface AssignedSeat {
  coach?: string;
  seatNumber: string;
  berthType: BerthType;
}

let counter = 0;
function unique(prefix: string): string {
  counter += 1;
  return `${prefix}${Date.now()}${counter}`;
}

export const TEST_PASSWORD = 'password123';

export async function createTestUser(overrides: Partial<{ name: string; email: string }> = {}): Promise<{
  user: UserDocument;
  password: string;
}> {
  // Low cost factor — these tests hash a lot of passwords and don't need
  // production-strength cost, just to exercise the hashing path.
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 4);
  const user = await UserModel.create({
    name: overrides.name ?? 'Test Passenger',
    email: overrides.email ?? `${unique('user')}@example.com`,
    passwordHash,
  });
  return { user, password: TEST_PASSWORD };
}

interface JourneyOverrides {
  pnr?: string;
  transportType?: TransportType;
  operatorName?: string;
  vehicleNumber?: string;
  from?: string;
  to?: string;
  boardingStation?: string;
  travelDate?: Date;
  class?: string;
  assignedSeat?: AssignedSeat;
}

export async function createTestJourney(
  userId: string,
  overrides: JourneyOverrides = {},
): Promise<JourneyDocument> {
  return JourneyModel.create({
    userId,
    pnr: overrides.pnr ?? unique('PNR'),
    transportType: overrides.transportType ?? 'train',
    operatorName: overrides.operatorName ?? 'Test Express',
    vehicleNumber: overrides.vehicleNumber ?? '99999',
    from: overrides.from ?? 'AAA',
    to: overrides.to ?? 'BBB',
    boardingStation: overrides.boardingStation ?? 'AAA',
    travelDate: overrides.travelDate ?? new Date('2027-01-01T00:00:00.000Z'),
    class: overrides.class ?? '3A',
    assignedSeat: overrides.assignedSeat ?? { coach: 'B1', seatNumber: '1', berthType: 'lower' },
  });
}

export async function createTestPreference(
  userId: string,
  journey: JourneyDocument,
  desiredBerthTypes: BerthType[],
  overrides: Partial<{ sameCoach: boolean; status: 'active' | 'matched' | 'cancelled' }> = {},
): Promise<SwapPreferenceDocument> {
  return SwapPreferenceModel.create({
    userId,
    journeyId: journey._id,
    currentSeat: journey.assignedSeat,
    desiredBerthTypes,
    sameCoach: overrides.sameCoach ?? false,
    status: overrides.status ?? 'active',
  });
}

/** Two journeys on the same train/date/class, with mutually-compatible seats. */
export async function createCompatiblePair(userAId: string, userBId: string) {
  const journeyA = await createTestJourney(userAId, {
    vehicleNumber: '12301',
    travelDate: new Date('2027-03-01T00:00:00.000Z'),
    class: '3A',
    assignedSeat: { coach: 'B4', seatNumber: '10', berthType: 'upper' },
  });
  const journeyB = await createTestJourney(userBId, {
    vehicleNumber: '12301',
    travelDate: new Date('2027-03-01T00:00:00.000Z'),
    class: '3A',
    assignedSeat: { coach: 'B4', seatNumber: '20', berthType: 'lower' },
  });

  const preferenceA = await createTestPreference(userAId, journeyA, ['lower']);
  const preferenceB = await createTestPreference(userBId, journeyB, ['upper']);

  return { journeyA, journeyB, preferenceA, preferenceB };
}
