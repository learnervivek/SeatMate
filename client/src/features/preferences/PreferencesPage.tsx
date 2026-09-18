import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { getApiErrorMessage } from '@/lib/apiClient';
import { useCurrentJourney } from '@/features/journeys/useCurrentJourney';
import type { BerthType, SwapPreference } from '@/types/domain';
import { getMatchesRequest, getPreferenceRequest } from './api';
import { PreferenceForm } from './PreferenceForm';

export function PreferencesPage() {
  const { current: journey, loading: journeyLoading, error: journeyError } = useCurrentJourney();
  const [preference, setPreference] = useState<SwapPreference | null>(null);
  const [matchBerthTypes, setMatchBerthTypes] = useState<BerthType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (journeyId: string) => {
    setLoading(true);
    setError(null);
    try {
      const preferenceData = await getPreferenceRequest(journeyId);
      setPreference(preferenceData);
      if (preferenceData?.status === 'active') {
        const matches = await getMatchesRequest(journeyId).catch(() => []);
        setMatchBerthTypes(matches.map((match) => match.currentSeat.berthType));
      } else {
        setMatchBerthTypes([]);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load your preference'));
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

  if (journeyLoading || (journey && loading)) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Card>
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="mt-4 h-40 w-full" />
        </Card>
      </div>
    );
  }

  if (journeyError || error) {
    return <ErrorState description={journeyError ?? error ?? 'Something went wrong.'} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl text-ink-900">Preferred seat</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
          Tell us which seat or berth type you&apos;d actually want, and we&apos;ll surface
          passengers on the same journey who fit.
        </p>
      </div>

      {!journey ? (
        <EmptyState
          title="Verify a journey first"
          description="Your preferred seat is tied to a specific journey. Verify a PNR to get started."
          action={
            <Link to="/journey">
              <span className="text-sm font-medium text-terracotta-600 hover:underline">
                Go to your journey →
              </span>
            </Link>
          }
        />
      ) : (
        <Card>
          <PreferenceForm
            journeyId={journey._id}
            transportType={journey.transportType}
            assignedSeat={journey.assignedSeat}
            matchBerthTypes={matchBerthTypes}
            initialPreference={preference}
            onSaved={() => load(journey._id)}
          />
        </Card>
      )}
    </div>
  );
}
