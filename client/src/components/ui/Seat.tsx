import type { BerthType } from '@/types/domain';

export type SeatState = 'mine' | 'selected' | 'match' | 'available' | 'unavailable';

const ABBREVIATIONS: Record<BerthType, string> = {
  lower: 'LB',
  middle: 'MB',
  upper: 'UB',
  'side-lower': 'SL',
  'side-upper': 'SU',
  window: 'W',
  aisle: 'A',
};

const STATE_CLASSES: Record<SeatState, string> = {
  mine: 'border-ink-900 bg-ink-900 text-stone-50 cursor-default',
  // bg/text-600, not -500: white text on -500 falls under WCAG AA contrast.
  selected: 'border-terracotta-600 bg-terracotta-600 text-white cursor-pointer hover:bg-terracotta-700',
  match: 'border-sage-400 bg-sage-50 text-sage-700 cursor-default',
  available:
    'border-warmgray-300 bg-white text-ink-500 cursor-pointer hover:border-ink-400 hover:bg-stone-50',
  unavailable: 'border-warmgray-200 bg-stone-100 text-ink-300 cursor-not-allowed',
};

const DEFAULT_STATE_DESCRIPTION: Record<SeatState, string> = {
  mine: 'your current reservation',
  selected: 'preferred, select to remove',
  match: 'held by a compatible passenger',
  available: 'available, select as preferred',
  unavailable: 'not selectable',
};

interface SeatProps {
  berthType: BerthType;
  state?: SeatState;
  size?: 'sm' | 'md';
  seatLabel?: string;
  onClick?: () => void;
  ariaLabel?: string;
}

export function Seat({ berthType, state = 'available', size = 'md', seatLabel, onClick, ariaLabel }: SeatProps) {
  const isInteractive = Boolean(onClick) && (state === 'available' || state === 'selected');
  const dimensions = size === 'sm' ? 'h-9 w-9 text-[10px]' : 'h-11 w-11 text-xs';
  const label = ariaLabel ?? `${berthType.replace('-', ' ')} berth, ${DEFAULT_STATE_DESCRIPTION[state]}`;

  return (
    <button
      type="button"
      disabled={!isInteractive}
      onClick={isInteractive ? onClick : undefined}
      aria-label={label}
      aria-pressed={isInteractive ? state === 'selected' : undefined}
      title={seatLabel ? `${seatLabel} · ${berthType.replace('-', ' ')}` : berthType.replace('-', ' ')}
      className={`flex ${dimensions} flex-col items-center justify-center rounded-sm border font-semibold uppercase leading-none transition-colors focus-visible:outline-offset-2 ${STATE_CLASSES[state]}`}
    >
      {ABBREVIATIONS[berthType]}
    </button>
  );
}
