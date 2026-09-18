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
}

export function SeatSwapDiagram({ a, b, size = 'md' }: SeatSwapDiagramProps) {
  const gap = size === 'sm' ? 'gap-3' : 'gap-5';
  return (
    <div className={`flex items-center ${gap}`}>
      <PassengerTicket passenger={a} size={size} />
      <SwapArrow />
      <PassengerTicket passenger={b} size={size} />
    </div>
  );
}

function PassengerTicket({ passenger, size }: { passenger: Passenger; size: 'sm' | 'md' }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-md border border-warmgray-200 bg-white ${
        size === 'sm' ? 'p-3' : 'p-4'
      }`}
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

function SwapArrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-5 w-5 shrink-0 text-terracotta-500">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h13m0 0l-3.5-3.5M17 8l-3.5 3.5M20 16H7m0 0l3.5-3.5M7 16l3.5 3.5" />
    </svg>
  );
}
