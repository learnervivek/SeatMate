import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getApiErrorMessage } from '@/lib/apiClient';
import { verifyPnrRequest } from '@/features/pnr/api';
import type { Journey } from '@/types/domain';

export function VerifyPnrForm({ onVerified }: { onVerified: (journey: Journey) => void }) {
  const [pnr, setPnr] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const journey = await verifyPnrRequest(pnr);
      setPnr('');
      onVerified(journey);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to verify this PNR'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Input
          label="PNR number"
          value={pnr}
          onChange={(e) => setPnr(e.target.value)}
          placeholder="e.g. 2458761023"
        />
      </div>
      <Button type="submit" variant="accent" isLoading={isSubmitting} disabled={pnr.trim().length === 0}>
        Verify journey
      </Button>
      {error && <p className="text-sm text-rust-500 sm:ml-2">{error}</p>}
    </form>
  );
}
