import { apiClient } from '@/lib/apiClient';
import type { Journey } from '@/types/domain';

export async function verifyPnrRequest(pnr: string): Promise<Journey> {
  const { data } = await apiClient.post<{ journey: Journey }>('/pnr/verify', { pnr });
  return data.journey;
}
