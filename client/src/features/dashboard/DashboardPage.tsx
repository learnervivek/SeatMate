import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { getApiErrorMessage } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useCurrentJourney } from '@/features/journeys/useCurrentJourney';
import { getMatchesRequest, getPreferenceRequest } from '@/features/preferences/api';
import { listIncomingSwapRequestsRequest, listOutgoingSwapRequestsRequest } from '@/features/swaps/api';
import { SWAP_STATUS_TONE } from '@/features/swaps/swapStatus';
import { BERTH_LABELS } from '@/types/domain';
import type { SwapPreference, SwapRequest } from '@/types/domain';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function counterpartName(request: SwapRequest, perspective: 'incoming' | 'outgoing'): string {
  const party = perspective === 'incoming' ? request.requesterId : request.receiverId;
  return typeof party === 'string' ? 'A passenger' : party.name;
}

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const notifications = useNotificationStore((state) => state.notifications);
  const { current: journey, loading: journeyLoading, error: journeyError } = useCurrentJourney();

  const [preference, setPreference] = useState<SwapPreference | null>(null);
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [incoming, setIncoming] = useState<SwapRequest[] | null>(null);
  const [outgoing, setOutgoing] = useState<SwapRequest[] | null>(null);
  const [extrasLoading, setExtrasLoading] = useState(true);
  const [extrasError, setExtrasError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    listIncomingSwapRequestsRequest()
      .then((result) => !cancelled && setIncoming(result))
      .catch(() => !cancelled && setIncoming([]));
    listOutgoingSwapRequestsRequest()
      .then((result) => !cancelled && setOutgoing(result))
      .catch(() => !cancelled && setOutgoing([]));

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (journeyLoading) return;
    if (!journey) {
      setExtrasLoading(false);
      return;
    }

    let cancelled = false;
    setExtrasLoading(true);
    setExtrasError(null);

    (async () => {
      try {
        const preferenceData = await getPreferenceRequest(journey._id);
        if (cancelled) return;
        setPreference(preferenceData);

        if (preferenceData?.status === 'active') {
          const matches = await getMatchesRequest(journey._id).catch(() => []);
          if (!cancelled) setMatchCount(matches.length);
        } else {
          setMatchCount(0);
        }
      } catch (err) {
        if (!cancelled) setExtrasError(getApiErrorMessage(err, 'Unable to load your activity'));
      } finally {
        if (!cancelled) setExtrasLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [journey, journeyLoading]);

  const pendingIncoming = (incoming ?? []).filter((r) => r.status === 'pending');
  const swapHistory = [...(incoming ?? []), ...(outgoing ?? [])]
    .filter((r) => r.status !== 'pending')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  if (journeyLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-2 h-4 w-56" />
        </div>
        <Card>
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-3 h-6 w-64" />
          <Skeleton className="mt-2 h-4 w-48" />
        </Card>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Card key={i}>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-5 w-32" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (journeyError) {
    return <ErrorState description={journeyError} />;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-2xl text-ink-900">Dashboard</h1>
        <p className="mt-1.5 text-sm text-ink-500">
          Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}.
        </p>
      </div>

      {/* Current journey & seat */}
      {journey ? (
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-terracotta-600">
                Current journey
              </p>
              <h2 className="mt-1 font-serif text-xl text-ink-900">
                {journey.operatorName} · {journey.vehicleNumber}
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                {journey.from} → {journey.to} · {formatDate(journey.travelDate)}
              </p>
            </div>
            <Badge tone={journey.transportType === 'train' ? 'accent' : 'neutral'}>
              {journey.transportType}
            </Badge>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
            <div>
              <p className="text-ink-400">Seat</p>
              <p className="font-medium text-ink-800">
                {journey.assignedSeat.coach ? `${journey.assignedSeat.coach}/` : ''}
                {journey.assignedSeat.seatNumber} ({BERTH_LABELS[journey.assignedSeat.berthType]})
              </p>
            </div>
            <div>
              <p className="text-ink-400">Class</p>
              <p className="font-medium text-ink-800">{journey.class}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/journey">
              <Button variant="secondary" size="sm">
                View journey
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <EmptyState
          title="No journey verified yet"
          description="Verify a PNR to bring in your seat assignment and start looking for a swap."
          action={
            <Link to="/journey">
              <Button variant="accent" size="sm">
                Verify a journey
              </Button>
            </Link>
          }
        />
      )}

      {/* Preferred seat / matches / pending requests */}
      {journey && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              Preferred seat
            </p>
            {extrasLoading ? (
              <Skeleton className="mt-3 h-5 w-32" />
            ) : preference?.status === 'active' ? (
              <p className="mt-2 text-sm font-medium text-ink-800">
                {preference.desiredBerthTypes.map((type) => BERTH_LABELS[type]).join(', ')}
              </p>
            ) : (
              <p className="mt-2 text-sm text-ink-500">Not set yet</p>
            )}
            <Link to="/preferences" className="mt-3 block text-sm font-medium text-terracotta-600 hover:underline">
              {preference?.status === 'active' ? 'Edit preference' : 'Set your preference'} →
            </Link>
          </Card>

          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              Compatible passengers
            </p>
            {extrasLoading ? (
              <Skeleton className="mt-3 h-5 w-24" />
            ) : (
              <p className="mt-2 text-sm font-medium text-ink-800">
                {matchCount ?? 0} compatible {matchCount === 1 ? 'passenger' : 'passengers'}
              </p>
            )}
            <Link to="/matches" className="mt-3 block text-sm font-medium text-terracotta-600 hover:underline">
              View matches →
            </Link>
          </Card>

          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              Pending swap requests
            </p>
            {incoming === null ? (
              <Skeleton className="mt-3 h-5 w-24" />
            ) : (
              <p className="mt-2 text-sm font-medium text-ink-800">
                {pendingIncoming.length === 0
                  ? "You're all caught up"
                  : `${pendingIncoming.length} waiting for your response`}
              </p>
            )}
            <Link to="/swaps" className="mt-3 block text-sm font-medium text-terracotta-600 hover:underline">
              View swap requests →
            </Link>
          </Card>
        </div>
      )}

      {extrasError && <ErrorState description={extrasError} />}

      {/* Recent notifications */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-800">Recent notifications</h2>
          <Link to="/notifications" className="text-sm font-medium text-terracotta-600 hover:underline">
            View all →
          </Link>
        </div>
        {notifications.length === 0 ? (
          <EmptyState
            title="No notifications yet"
            description="You'll see swap requests and responses here."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.slice(0, 5).map((notification) => (
              <Card key={notification._id} padding="sm">
                <p className="text-sm font-medium text-ink-800">{notification.title}</p>
                <p className="mt-0.5 text-sm text-ink-500">{notification.message}</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Swap history */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink-800">Swap history</h2>
        {incoming === null || outgoing === null ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 2 }, (_, i) => (
              <Card key={i} padding="sm">
                <Skeleton className="h-4 w-48" />
              </Card>
            ))}
          </div>
        ) : swapHistory.length === 0 ? (
          <EmptyState
            title="No past swaps yet"
            description="Once a swap request is accepted, rejected, or cancelled, it'll show up here."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {swapHistory.map((request) => {
              const perspective: 'incoming' | 'outgoing' = incoming.some((r) => r._id === request._id)
                ? 'incoming'
                : 'outgoing';
              return (
                <Card key={request._id} padding="sm" className="flex items-center justify-between gap-3">
                  <p className="text-sm text-ink-700">
                    {perspective === 'incoming'
                      ? `${counterpartName(request, 'incoming')} → You`
                      : `You → ${counterpartName(request, 'outgoing')}`}
                  </p>
                  <Badge tone={SWAP_STATUS_TONE[request.status]}>{request.status}</Badge>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
