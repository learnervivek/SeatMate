import { apiClient } from '@/lib/apiClient';
import type { BerthType, SeatMatch, SeatRange, SwapPreference } from '@/types/domain';

export interface PreferenceInput {
  desiredBerthTypes: BerthType[];
  sameCoach?: boolean;
  preferredSeatRange?: SeatRange;
}

export async function createPreferenceRequest(
  journeyId: string,
  input: PreferenceInput,
): Promise<SwapPreference> {
  const { data } = await apiClient.post<{ preference: SwapPreference }>('/preferences', {
    journeyId,
    ...input,
  });
  return data.preference;
}

export async function getPreferenceRequest(journeyId: string): Promise<SwapPreference | null> {
  try {
    const { data } = await apiClient.get<{ preference: SwapPreference }>(`/preferences/${journeyId}`);
    return data.preference;
  } catch {
    return null;
  }
}

export async function updatePreferenceRequest(
  preferenceId: string,
  input: Partial<PreferenceInput>,
): Promise<SwapPreference> {
  const { data } = await apiClient.patch<{ preference: SwapPreference }>(
    `/preferences/${preferenceId}`,
    input,
  );
  return data.preference;
}

export async function getMatchesRequest(journeyId: string): Promise<SeatMatch[]> {
  const { data } = await apiClient.get<{ matches: SeatMatch[] }>(`/preferences/${journeyId}/matches`);
  return data.matches;
}
