import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { getApiErrorMessage } from '@/lib/apiClient';
import { useCurrentJourney } from '@/features/journeys/useCurrentJourney';
import { getMatchesRequest, getPreferenceRequest } from '@/features/preferences/api';
import type { SeatMatch, SwapPreference } from '@/types/domain';
import { listOutgoingSwapRequestsRequest } from './api';
import { MatchesList } from './MatchesList';

export function MatchesPage() {
  const { current: journey, loading: journeyLoading, error: journeyError } = useCurrentJourney();
  const [preference, setPreference] = useState<SwapPreference | null>(null);
  const [matches, setMatches] = useState<SeatMatch[] | null>(null);
  const [sentJourneyIds, setSentJourneyIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (journeyId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [preferenceData, outgoing] = await Promise.all([
        getPreferenceRequest(journeyId),
        listOutgoingSwapRequestsRequest(),
      ]);
      setPreference(preferenceData);
      setSentJourneyIds(
        new Set(
          outgoing
            .filter((r) => {
              const requesterJourneyId =
                typeof r.requesterJourneyId === 'string' ? r.requesterJourneyId : r.requesterJourneyId._id;
              return requesterJourneyId === journeyId && r.status === 'pending';
            })
            .map((r) => (typeof r.receiverJourneyId === 'string' ? r.receiverJourneyId : r.receiverJourneyId._id)),
        ),
      );

      if (preferenceData?.status === 'active') {
        const result = await getMatchesRequest(journeyId).catch(() => []);
        setMatches(result);
      } else {
        setMatches([]);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load matches'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (journey) {
      load(journey._id);
    } else if (!journeyLoading) {
      setLoading(false);
    }
  }, [journey, journeyLoading, load]);

  function handleRequestSent(recipientJourneyId: string) {
    setSentJourneyIds((prev) => new Set(prev).add(recipientJourneyId));
  }

  if (journeyLoading || (journey && loading)) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        {Array.from({ length: 2 }, (_, i) => (
          <Card key={i}>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-3 w-56" />
          </Card>
        ))}
      </div>
    );
  }

  if (journeyError || error) {
    return <ErrorState description={journeyError ?? error ?? 'Something went wrong.'} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl text-ink-900">Compatible passengers</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
          Passengers on the same journey whose seat fits your preference — and who&apos;d want
          yours back.
        </p>
      </div>

      {!journey ? (
        <EmptyState
          title="Verify a journey first"
          description="Matches are tied to a specific journey. Verify a PNR to get started."
          action={
            <Link to="/journey">
              <span className="text-sm font-medium text-terracotta-600 hover:underline">
                Go to your journey →
              </span>
            </Link>
          }
        />
      ) : preference?.status !== 'active' ? (
        <EmptyState
          title="Set your preferred seat first"
          description="We'll look for compatible passengers once you tell us which seat you'd want instead."
          action={
            <Link to="/preferences">
              <span className="text-sm font-medium text-terracotta-600 hover:underline">
                Set your preference →
              </span>
            </Link>
          }
        />
      ) : (
        <MatchesList
          journeyId={journey._id}
          matches={matches ?? []}
          sentJourneyIds={sentJourneyIds}
          onRequestSent={handleRequestSent}
        />
      )}
    </div>
  );
}
