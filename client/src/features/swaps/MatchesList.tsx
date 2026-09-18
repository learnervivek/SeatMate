import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { getApiErrorMessage } from '@/lib/apiClient';
import { toast } from '@/store/toastStore';
import { BERTH_LABELS } from '@/types/domain';
import type { SeatMatch } from '@/types/domain';
import { createSwapRequestRequest } from './api';
import { MatchCard } from './MatchCard';

interface MatchesListProps {
  journeyId: string;
  matches: SeatMatch[];
  sentJourneyIds: Set<string>;
  onRequestSent: (recipientJourneyId: string) => void;
}

export function MatchesList({ journeyId, matches, sentJourneyIds, onRequestSent }: MatchesListProps) {
  const [target, setTarget] = useState<SeatMatch | null>(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  function openConfirm(match: SeatMatch) {
    setMessage('');
    setTarget(match);
  }

  async function handleConfirm() {
    if (!target) return;
    setIsSending(true);
    try {
      await createSwapRequestRequest({
        requesterJourneyId: journeyId,
        receiverJourneyId: target.journeyId,
        message: message.trim() || undefined,
      });
      onRequestSent(target.journeyId);
      toast.success(`Swap request sent to ${target.passenger.name}.`);
      setTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to send swap request'));
    } finally {
      setIsSending(false);
    }
  }

  if (matches.length === 0) {
    return (
      <EmptyState
        title="No compatible passengers yet"
        description="Your journey is verified. We'll show potential matches when another passenger with a compatible preference becomes available."
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {matches.map((match) => (
          <MatchCard
            key={match.journeyId}
            match={match}
            alreadySent={sentJourneyIds.has(match.journeyId)}
            isSending={isSending && target?.journeyId === match.journeyId}
            onRequest={() => openConfirm(match)}
          />
        ))}
      </div>

      <Modal
        isOpen={target !== null}
        onClose={() => setTarget(null)}
        title="Send swap request"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button variant="accent" isLoading={isSending} onClick={handleConfirm}>
              Send request
            </Button>
          </>
        }
      >
        {target && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ink-600">
              You&apos;re offering your seat to <strong className="text-ink-900">{target.passenger.name}</strong> in
              exchange for their seat{' '}
              {target.currentSeat.coach ? `${target.currentSeat.coach}/` : ''}
              {target.currentSeat.seatNumber} (
              {BERTH_LABELS[target.currentSeat.berthType]}). They&apos;ll need to accept before
              anything changes.
            </p>
            <Input
              label="Add a note (optional)"
              placeholder="e.g. Travelling with my kid, would appreciate the swap"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={280}
            />
          </div>
        )}
      </Modal>
    </>
  );
}
