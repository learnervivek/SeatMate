import { apiClient } from '@/lib/apiClient';
import type { SwapRequest } from '@/types/domain';

export async function createSwapRequestRequest(payload: {
  requesterJourneyId: string;
  receiverJourneyId: string;
  message?: string;
}): Promise<SwapRequest> {
  const { data } = await apiClient.post<{ swapRequest: SwapRequest }>('/swaps', payload);
  return data.swapRequest;
}

export async function listIncomingSwapRequestsRequest(): Promise<SwapRequest[]> {
  const { data } = await apiClient.get<{ swapRequests: SwapRequest[] }>('/swaps/incoming');
  return data.swapRequests;
}

export async function listOutgoingSwapRequestsRequest(): Promise<SwapRequest[]> {
  const { data } = await apiClient.get<{ swapRequests: SwapRequest[] }>('/swaps/outgoing');
  return data.swapRequests;
}

export async function acceptSwapRequestRequest(swapRequestId: string): Promise<SwapRequest> {
  const { data } = await apiClient.patch<{ swapRequest: SwapRequest }>(
    `/swaps/${swapRequestId}/accept`,
  );
  return data.swapRequest;
}

export async function rejectSwapRequestRequest(swapRequestId: string): Promise<SwapRequest> {
  const { data } = await apiClient.patch<{ swapRequest: SwapRequest }>(
    `/swaps/${swapRequestId}/reject`,
  );
  return data.swapRequest;
}

export async function cancelSwapRequestRequest(swapRequestId: string): Promise<SwapRequest> {
  const { data } = await apiClient.patch<{ swapRequest: SwapRequest }>(
    `/swaps/${swapRequestId}/cancel`,
  );
  return data.swapRequest;
}
