import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { BERTH_LABELS } from '@/types/domain';
import type { AssignedSeat, SwapRequest } from '@/types/domain';
import { SWAP_STATUS_TONE } from './swapStatus';

function seatLabel(seat: AssignedSeat): string {
  return `${seat.coach ? `${seat.coach}/` : ''}${seat.seatNumber} (${BERTH_LABELS[seat.berthType]})`;
}

type Action = 'accept' | 'reject' | 'cancel';

interface SwapRequestCardProps {
  request: SwapRequest;
  perspective: 'sent' | 'received';
  onAccept?: (id: string) => Promise<void>;
  onReject?: (id: string) => Promise<void>;
  onCancel?: (id: string) => Promise<void>;
}

export function SwapRequestCard({ request, perspective, onAccept, onReject, onCancel }: SwapRequestCardProps) {
  const [pendingAction, setPendingAction] = useState<Action | null>(null);

  const requesterName =
    typeof request.requesterId === 'string' ? 'A passenger' : request.requesterId.name;
  const receiverName =
    typeof request.receiverId === 'string' ? 'A passenger' : request.receiverId.name;

  async function handle(action: Action, handler?: (id: string) => Promise<void>) {
    if (!handler) return;
    setPendingAction(action);
    await handler(request._id);
    setPendingAction(null);
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink-900">
            {perspective === 'sent' ? `You → ${receiverName}` : `${requesterName} → You`}
          </p>
          <p className="mt-1 text-sm text-ink-600">
            {perspective === 'sent'
              ? `Your seat ${seatLabel(request.requesterSeat)} ↔ their seat ${seatLabel(request.receiverSeat)}`
              : `Their seat ${seatLabel(request.requesterSeat)} ↔ your seat ${seatLabel(request.receiverSeat)}`}
          </p>
          {request.message && (
            <p className="mt-1 text-sm italic text-ink-400">&ldquo;{request.message}&rdquo;</p>
          )}
        </div>
        <Badge tone={SWAP_STATUS_TONE[request.status]}>{request.status}</Badge>
      </div>

      {perspective === 'received' && request.status === 'pending' && (onAccept || onReject) && (
        <div className="mt-4 flex gap-2">
          <Button
            variant="accent"
            isLoading={pendingAction === 'accept'}
            disabled={pendingAction !== null}
            onClick={() => handle('accept', onAccept)}
          >
            Accept
          </Button>
          <Button
            variant="danger"
            isLoading={pendingAction === 'reject'}
            disabled={pendingAction !== null}
            onClick={() => handle('reject', onReject)}
          >
            Decline
          </Button>
        </div>
      )}

      {perspective === 'sent' && request.status === 'pending' && onCancel && (
        <div className="mt-4">
          <Button
            variant="secondary"
            isLoading={pendingAction === 'cancel'}
            disabled={pendingAction !== null}
            onClick={() => handle('cancel', onCancel)}
          >
            Cancel request
          </Button>
        </div>
      )}
    </Card>
  );
}
