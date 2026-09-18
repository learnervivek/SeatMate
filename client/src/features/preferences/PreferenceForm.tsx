import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SeatMap } from '@/components/ui/SeatMap';
import { getApiErrorMessage } from '@/lib/apiClient';
import { toast } from '@/store/toastStore';
import { berthTypesForTransport, BERTH_LABELS } from '@/types/domain';
import type { AssignedSeat, BerthType, SwapPreference, TransportType } from '@/types/domain';
import { createPreferenceRequest, updatePreferenceRequest } from './api';

interface PreferenceFormProps {
  journeyId: string;
  transportType: TransportType;
  assignedSeat: AssignedSeat;
  matchBerthTypes: BerthType[];
  initialPreference: SwapPreference | null;
  onSaved: (preference: SwapPreference) => void;
}

export function PreferenceForm({
  journeyId,
  transportType,
  assignedSeat,
  matchBerthTypes,
  initialPreference,
  onSaved,
}: PreferenceFormProps) {
  const [selected, setSelected] = useState<BerthType[]>(
    initialPreference?.desiredBerthTypes ?? [],
  );
  const [sameCoach, setSameCoach] = useState(initialPreference?.sameCoach ?? false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectableOptions = berthTypesForTransport(transportType).filter(
    (type) => type !== assignedSeat.berthType,
  );

  function toggle(type: BerthType) {
    if (type === assignedSeat.berthType) return;
    setError(null);
    setSelected((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  async function handleSubmit() {
    if (selected.length === 0) {
      setError('Select at least one seat on the map below to set your preference');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const preference = initialPreference
        ? await updatePreferenceRequest(initialPreference._id, { desiredBerthTypes: selected, sameCoach })
        : await createPreferenceRequest(journeyId, { desiredBerthTypes: selected, sameCoach });
      onSaved(preference);
      toast.success("Preference saved — we'll surface anyone with a matching seat.");
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to save your preference'));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (selectableOptions.length === 0) {
    return (
      <EmptyState
        title="No alternate seat types available"
        description="There's nothing else to prefer on this journey's seat map."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-600">
        Your current reservation is <strong className="font-semibold text-ink-800">{BERTH_LABELS[assignedSeat.berthType]}</strong>{' '}
        (seat {assignedSeat.seatNumber}). Tap a seat below to mark it as your preferred type — this
        only updates your SeatMate preference, it does <strong>not</strong> change your official
        railway or airline booking.
      </p>

      <SeatMap
        transportType={transportType}
        assignedSeat={assignedSeat}
        selectedBerthTypes={selected}
        matchBerthTypes={matchBerthTypes}
        onToggleBerthType={toggle}
      />

      <p className="text-sm text-ink-500">
        {selected.length === 0
          ? 'No preference selected yet.'
          : `Preferred: ${selected.map((type) => BERTH_LABELS[type]).join(', ')}`}
      </p>

      {transportType === 'train' && (
        <label className="flex w-fit items-center gap-2 text-sm text-ink-600">
          <input
            type="checkbox"
            checked={sameCoach}
            onChange={(e) => setSameCoach(e.target.checked)}
            className="h-4 w-4 rounded-sm border-warmgray-400 text-terracotta-500 focus:ring-terracotta-500"
          />
          Only match passengers in my coach
        </label>
      )}

      {error && <p className="text-sm text-rust-500">{error}</p>}

      <Button variant="accent" onClick={handleSubmit} isLoading={isSubmitting} className="w-fit">
        {initialPreference ? 'Update preferred seat' : 'Save preferred seat'}
      </Button>
    </div>
  );
}
