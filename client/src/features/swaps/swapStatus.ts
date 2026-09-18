import type { SwapRequestStatus } from '@/types/domain';

export const SWAP_STATUS_TONE: Record<
  SwapRequestStatus,
  'neutral' | 'success' | 'warning' | 'danger' | 'accent'
> = {
  pending: 'warning',
  accepted: 'accent',
  completed: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
  expired: 'neutral',
};
