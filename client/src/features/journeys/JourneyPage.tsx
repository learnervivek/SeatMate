import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { BERTH_LABELS } from '@/types/domain';
import { toast } from '@/store/toastStore';
import type { Journey } from '@/types/domain';
import { useCurrentJourney } from './useCurrentJourney';
import { VerifyPnrForm } from './VerifyPnrForm';
import { JourneyCard } from './JourneyCard';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function JourneyPage() {
  const { journeys, current, loading, error, refetch } = useCurrentJourney();

  function handleVerified(journey: Journey) {
    refetch();
    toast.success(`Journey verified — ${journey.operatorName} on ${journey.travelDate.slice(0, 10)}.`);
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Card>
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-3 h-6 w-64" />
          <Skeleton className="mt-2 h-4 w-48" />
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mt-2 h-4 w-12" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return <ErrorState description={error} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl text-ink-900">Your journey</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
          This uses a sample PNR dataset for demonstration — it is not connected to a real railway
          or airline reservation system.
        </p>
      </div>

      {current ? (
        <>
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-terracotta-600">
                  Your current reservation
                </p>
                <h2 className="mt-1 font-serif text-xl text-ink-900">
                  {current.operatorName} · {current.vehicleNumber}
                </h2>
                <p className="mt-1 text-sm text-ink-500">
                  {current.from} → {current.to} · {formatDate(current.travelDate)}
                </p>
              </div>
              <Badge tone={current.transportType === 'train' ? 'accent' : 'neutral'}>
                {current.transportType}
              </Badge>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-5">
              <div>
                <p className="text-ink-400">Class</p>
                <p className="font-medium text-ink-800">{current.class}</p>
              </div>
              <div>
                <p className="text-ink-400">Boarding station</p>
                <p className="font-medium text-ink-800">{current.boardingStation ?? '—'}</p>
              </div>
              <div>
                <p className="text-ink-400">Coach</p>
                <p className="font-medium text-ink-800">{current.assignedSeat.coach ?? '—'}</p>
              </div>
              <div>
                <p className="text-ink-400">Seat</p>
                <p className="font-medium text-ink-800">{current.assignedSeat.seatNumber}</p>
              </div>
              <div>
                <p className="text-ink-400">Berth type</p>
                <p className="font-medium text-ink-800">
                  {BERTH_LABELS[current.assignedSeat.berthType]}
                </p>
              </div>
            </div>

            <p className="mt-4 font-mono text-xs text-ink-400">PNR {current.pnr}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/preferences">
                <Button variant="accent" size="sm">
                  Set preferred seat
                </Button>
              </Link>
              <Link to="/matches">
                <Button variant="secondary" size="sm">
                  View matches
                </Button>
              </Link>
            </div>
          </Card>

          {journeys && journeys.length > 1 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-ink-800">Other verified journeys</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {journeys.slice(1).map((journey) => (
                  <JourneyCard key={journey._id} journey={journey} compact />
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-ink-800">
          {current ? 'Verify another journey' : 'Verify your first journey'}
        </h2>
        <VerifyPnrForm onVerified={handleVerified} />
      </Card>
    </div>
  );
}
