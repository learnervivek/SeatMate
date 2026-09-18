import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../../test/db';
import { createTestUser } from '../../test/factories';
import { ConflictError, NotFoundError } from '../../lib/errors';
import { verifyPnrForUser } from '../journeys/journey.service';
import { JourneyModel } from '../journeys/journey.model';
import { pnrService } from './pnrService';

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

// A known-good record from the mock dataset — see mockPnrData.ts.
const VALID_PNR = '2458761023';

describe('pnrService.lookup (mock provider)', () => {
  it('returns the record for a known PNR', async () => {
    const result = await pnrService.lookup(VALID_PNR);
    expect(result).not.toBeNull();
    expect(result!.vehicleNumber).toBe('12301');
    expect(result!.passengers.length).toBeGreaterThan(0);
  });

  it('is case- and whitespace-insensitive', async () => {
    const result = await pnrService.lookup(`  ${VALID_PNR.toLowerCase()}  `);
    expect(result).not.toBeNull();
  });

  it('returns null for an unknown PNR', async () => {
    const result = await pnrService.lookup('0000000000');
    expect(result).toBeNull();
  });
});

describe('verifyPnrForUser', () => {
  it('creates a journey with only the fields the app actually needs', async () => {
    const { user } = await createTestUser();

    const journey = await verifyPnrForUser(user._id.toString(), VALID_PNR);

    expect(journey.pnr).toBe(VALID_PNR);
    expect(journey.userId.toString()).toBe(user._id.toString());
    expect(journey.assignedSeat.berthType).toBe('side-upper');
    // Passenger name/age and co-passengers from the PNR are never persisted.
    expect((journey as unknown as Record<string, unknown>).passengers).toBeUndefined();
    expect((journey as unknown as Record<string, unknown>).passengerName).toBeUndefined();
  });

  it('is idempotent for the same user re-verifying their own PNR', async () => {
    const { user } = await createTestUser();

    const first = await verifyPnrForUser(user._id.toString(), VALID_PNR);
    const second = await verifyPnrForUser(user._id.toString(), VALID_PNR);

    expect(second._id.toString()).toBe(first._id.toString());
    expect(await JourneyModel.countDocuments({ pnr: VALID_PNR })).toBe(1);
  });

  it('rejects a PNR already claimed by a different account', async () => {
    const { user: userA } = await createTestUser({ email: 'a@example.com' });
    const { user: userB } = await createTestUser({ email: 'b@example.com' });

    await verifyPnrForUser(userA._id.toString(), VALID_PNR);

    await expect(verifyPnrForUser(userB._id.toString(), VALID_PNR)).rejects.toThrow(ConflictError);
  });

  it('rejects an invalid/unknown PNR', async () => {
    const { user } = await createTestUser();

    await expect(verifyPnrForUser(user._id.toString(), '9999999999')).rejects.toThrow(NotFoundError);
  });
});
