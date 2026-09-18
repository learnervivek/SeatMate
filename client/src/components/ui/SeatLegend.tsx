import type { SeatState } from './Seat';

const ITEMS: { state: SeatState; label: string; swatchClass: string }[] = [
  { state: 'mine', label: 'Your current reservation', swatchClass: 'border-ink-900 bg-ink-900' },
  { state: 'selected', label: 'Preferred', swatchClass: 'border-terracotta-600 bg-terracotta-600' },
  { state: 'match', label: 'Compatible passenger', swatchClass: 'border-sage-400 bg-sage-50' },
  { state: 'available', label: 'Available', swatchClass: 'border-warmgray-300 bg-white' },
  { state: 'unavailable', label: 'Unavailable', swatchClass: 'border-warmgray-200 bg-stone-100' },
];

export function SeatLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-500">
      {ITEMS.map((item) => (
        <li key={item.state} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-sm border ${item.swatchClass}`} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
