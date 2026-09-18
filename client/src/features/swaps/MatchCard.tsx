import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { BERTH_LABELS } from '@/types/domain';
import type { SeatMatch } from '@/types/domain';

interface MatchCardProps {
  match: SeatMatch;
  alreadySent: boolean;
  isSending: boolean;
  onRequest: () => void;
}

export function MatchCard({ match, alreadySent, isSending, onRequest }: MatchCardProps) {
  const scoreTone = match.score >= 75 ? 'success' : match.score >= 50 ? 'accent' : 'neutral';

  return (
    <Card className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          {match.passenger.name}
          <Badge tone={scoreTone}>{match.score} match score</Badge>
        </p>
        <p className="mt-1 text-sm text-ink-500">
          Seat {match.currentSeat.coach ? `${match.currentSeat.coach}/` : ''}
          {match.currentSeat.seatNumber} — {BERTH_LABELS[match.currentSeat.berthType]}
        </p>
        <ul className="mt-1.5 flex flex-col gap-0.5 text-xs text-ink-400">
          {match.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </div>
      <Button
        variant={alreadySent ? 'secondary' : 'accent'}
        disabled={alreadySent}
        isLoading={isSending}
        onClick={onRequest}
      >
        {alreadySent ? 'Request sent' : 'Request swap'}
      </Button>
    </Card>
  );
}
