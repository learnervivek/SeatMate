import { useEffect, useState } from 'react';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { getApiErrorMessage } from '@/lib/apiClient';
import { toast } from '@/store/toastStore';
import type { SwapRequest } from '@/types/domain';
import {
  acceptSwapRequestRequest,
  cancelSwapRequestRequest,
  listIncomingSwapRequestsRequest,
  listOutgoingSwapRequestsRequest,
  rejectSwapRequestRequest,
} from './api';
import { SwapRequestCard } from './SwapRequestCard';

type Tab = 'received' | 'sent';

export function SwapRequestsPage() {
  const [tab, setTab] = useState<Tab>('received');
  const [outgoing, setOutgoing] = useState<SwapRequest[] | null>(null);
  const [incoming, setIncoming] = useState<SwapRequest[] | null>(null);

  useEffect(() => {
    Promise.all([listIncomingSwapRequestsRequest(), listOutgoingSwapRequestsRequest()])
      .then(([incomingData, outgoingData]) => {
        setIncoming(incomingData);
        setOutgoing(outgoingData);
      })
      .catch((error) => {
        setIncoming([]);
        setOutgoing([]);
        toast.error(getApiErrorMessage(error, 'Unable to load swap requests'));
      });
  }, []);

  async function handleAccept(id: string) {
    try {
      const updated = await acceptSwapRequestRequest(id);
      setIncoming((prev) => prev?.map((r) => (r._id === id ? updated : r)) ?? null);
      toast.success('Swap accepted — seats have been updated.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to accept this request'));
    }
  }

  async function handleReject(id: string) {
    try {
      const updated = await rejectSwapRequestRequest(id);
      setIncoming((prev) => prev?.map((r) => (r._id === id ? updated : r)) ?? null);
      toast.success('Request declined.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to decline this request'));
    }
  }

  async function handleCancel(id: string) {
    try {
      const updated = await cancelSwapRequestRequest(id);
      setOutgoing((prev) => prev?.map((r) => (r._id === id ? updated : r)) ?? null);
      toast.success('Request cancelled.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to cancel this request'));
    }
  }

  const items = tab === 'received' ? incoming : outgoing;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl text-ink-900">Swap requests</h1>
        <p className="mt-1.5 text-sm text-ink-500">
          Review requests you&apos;ve received, or track ones you&apos;ve sent.
        </p>
      </div>

      <div className="flex gap-6 border-b border-warmgray-200">
        {(['received', 'sent'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-1 pb-2.5 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? 'border-terracotta-500 text-ink-900'
                : 'border-transparent text-ink-400 hover:text-ink-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {items === null ? (
        <LoadingState label="Loading swap requests" />
      ) : items.length === 0 ? (
        <EmptyState
          title={`No ${tab} swap requests`}
          description={
            tab === 'received'
              ? "When another passenger offers you a swap, it'll show up here."
              : "Requests you send from a journey's match list will show up here."
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((request) => (
            <SwapRequestCard
              key={request._id}
              request={request}
              perspective={tab === 'received' ? 'received' : 'sent'}
              onAccept={tab === 'received' ? handleAccept : undefined}
              onReject={tab === 'received' ? handleReject : undefined}
              onCancel={tab === 'sent' ? handleCancel : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
