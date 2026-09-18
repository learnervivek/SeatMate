import { apiClient } from '@/lib/apiClient';
import type { Journey } from '@/types/domain';

export async function listMyJourneysRequest(): Promise<Journey[]> {
  const { data } = await apiClient.get<{ journeys: Journey[] }>('/journeys');
  return data.journeys;
}
