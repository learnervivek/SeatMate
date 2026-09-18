import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/lib/apiClient';
import type { Journey } from '@/types/domain';
import { listMyJourneysRequest } from './api';

interface UseCurrentJourneyResult {
  journeys: Journey[] | null;
  current: Journey | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * "Current journey" = the soonest upcoming active journey (the API already
 * returns journeys sorted by travelDate ascending). Most of the app is
 * scoped to this one journey rather than requiring the user to pick from a
 * list — see architecture.md for the reasoning.
 */
export function useCurrentJourney(): UseCurrentJourneyResult {
  const [journeys, setJourneys] = useState<Journey[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    listMyJourneysRequest()
      .then((result) => {
        if (!cancelled) setJourneys(result);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Unable to load your journeys'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const refetch = useCallback(() => setReloadToken((n) => n + 1), []);

  return {
    journeys,
    current: journeys?.[0] ?? null,
    loading,
    error,
    refetch,
  };
}
