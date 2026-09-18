import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BERTH_LABELS } from '@/types/domain';
import type { Journey } from '@/types/domain';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface JourneyCardProps {
  journey: Journey;
  compact?: boolean;
}

export function JourneyCard({ journey, compact = false }: JourneyCardProps) {
  return (
    <Card padding={compact ? 'sm' : 'md'}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-ink-900">
            {journey.operatorName} · {journey.vehicleNumber}
          </p>
          <p className="mt-0.5 text-sm text-ink-500">
            {journey.from} → {journey.to}
          </p>
        </div>
        <Badge tone={journey.transportType === 'train' ? 'accent' : 'neutral'}>
          {journey.transportType}
        </Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-ink-600">
        <span>{formatDate(journey.travelDate)}</span>
        <span>Class {journey.class}</span>
        <span>
          Seat {journey.assignedSeat.coach ? `${journey.assignedSeat.coach}/` : ''}
          {journey.assignedSeat.seatNumber} ({BERTH_LABELS[journey.assignedSeat.berthType]})
        </span>
      </div>

      {!compact && <p className="mt-3 font-mono text-xs text-ink-400">PNR {journey.pnr}</p>}
    </Card>
  );
}
