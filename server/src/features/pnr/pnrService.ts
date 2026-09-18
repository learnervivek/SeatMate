import { MOCK_PNR_RECORDS } from './mockPnrData';
import type { PNRLookupResult } from './pnr.types';

/**
 * Abstraction over "how we get PNR data." Callers depend on this interface
 * only, never on the mock dataset directly — swapping in an authorized
 * external railway/airline provider later means writing a new class that
 * implements this interface and changing the `pnrService` export below.
 * Nothing in journey.service.ts, pnr.controller.ts, or the frontend needs
 * to change.
 */
export interface PNRService {
  lookup(pnr: string): Promise<PNRLookupResult | null>;
}

/**
 * Mock provider — demo/portfolio data only. See mockPnrData.ts for the
 * "not connected to a real reservation system" disclosure.
 */
class MockPNRService implements PNRService {
  async lookup(pnr: string): Promise<PNRLookupResult | null> {
    const normalized = pnr.trim().toUpperCase();
    const record = MOCK_PNR_RECORDS.find((r) => r.pnr.toUpperCase() === normalized);
    return record ?? null;
  }
}

export const pnrService: PNRService = new MockPNRService();
