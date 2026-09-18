import { useState } from 'react';
import { Seat } from '@/components/ui/Seat';
import type { BerthType } from '@/types/domain';

interface Passenger {
  name: string;
  coach: string;
  seat: string;
  berthType: BerthType;
  berthLabel: string;
}

interface SeatSwapDiagramProps {
  a: Passenger;
  b: Passenger;
  size?: 'sm' | 'md';
  /** When true, renders a "Swap seats" control that animates the two tickets crossing over. */
  interactive?: boolean;
}

export function SeatSwapDiagram({ a, b, size = 'md', interactive = false }: SeatSwapDiagramProps) {
  const [swapped, setSwapped] = useState(false);
  const gap = size === 'sm' ? 'gap-3' : 'gap-5';
  const shiftClass = 'translate-x-[calc(100%+0.75rem)] sm:translate-x-[calc(100%+1.25rem)]';

  const left = swapped ? b : a;
  const right = swapped ? a : b;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`flex items-center ${gap}`}>
        <div
          className={`transition-transform duration-700 ease-in-out motion-reduce:transition-none ${
            swapped ? shiftClass : 'translate-x-0'
          }`}
        >
          <PassengerTicket passenger={left} size={size} highlight={interactive && swapped} />
        </div>
        <SwapArrow pulse={interactive && swapped} />
        <div
          className={`transition-transform duration-700 ease-in-out motion-reduce:transition-none ${
            swapped ? `-${shiftClass}` : 'translate-x-0'
          }`}
        >
          <PassengerTicket passenger={right} size={size} highlight={interactive && swapped} />
        </div>
      </div>

      {interactive && (
        <button
          type="button"
          onClick={() => setSwapped((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-md border border-warmgray-300 bg-white px-3.5 py-1.5 text-xs font-medium text-ink-700 transition-colors hover:border-ink-400 hover:bg-stone-50"
        >
          {swapped ? 'Swap back' : 'Try swapping their seats'}
        </button>
      )}
    </div>
  );
}

function PassengerTicket({
  passenger,
  size,
  highlight = false,
}: {
  passenger: Passenger;
  size: 'sm' | 'md';
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-md border bg-white transition-colors duration-500 ${
        size === 'sm' ? 'p-3' : 'p-4'
      } ${highlight ? 'border-sage-400' : 'border-warmgray-200'}`}
    >
      <Seat berthType={passenger.berthType} state="mine" size={size} />
      <div>
        <p className="text-sm font-semibold text-ink-900">{passenger.name}</p>
        <p className="text-xs text-ink-500">
          {passenger.coach} · {passenger.seat} · {passenger.berthLabel}
        </p>
      </div>
    </div>
  );
}

function SwapArrow({ pulse = false }: { pulse?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      className={`h-5 w-5 shrink-0 text-terracotta-500 transition-transform duration-500 motion-reduce:transition-none ${
        pulse ? 'scale-125' : 'scale-100'
      }`}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h13m0 0l-3.5-3.5M17 8l-3.5 3.5M20 16H7m0 0l3.5-3.5M7 16l3.5 3.5" />
    </svg>
  );
}
