interface TrainTrackProps {
  variant?: 'light' | 'dark';
  className?: string;
}

/**
 * A decorative, looping train-on-a-track animation. Respects
 * prefers-reduced-motion (the train simply sits still on the rail instead of
 * looping) via the motion-reduce: variant, which needs no extra config.
 */
export function TrainTrack({ variant = 'light', className = '' }: TrainTrackProps) {
  const trackColor = variant === 'dark' ? 'stroke-ink-600' : 'stroke-warmgray-300';
  const tieColor = variant === 'dark' ? 'bg-ink-700' : 'bg-warmgray-200';
  const trainColor = variant === 'dark' ? 'text-terracotta-400' : 'text-ink-800';

  return (
    <div className={`relative h-14 w-full overflow-hidden ${className}`} aria-hidden="true">
      <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 gap-2.5">
        {Array.from({ length: 28 }, (_, i) => (
          <span key={i} className={`h-3 w-1 shrink-0 rounded-[1px] ${tieColor}`} />
        ))}
      </div>
      <svg viewBox="0 0 1000 4" preserveAspectRatio="none" className="absolute inset-x-0 top-1/2 h-px w-full -translate-y-1/2">
        <line x1="0" y1="2" x2="1000" y2="2" strokeWidth="2" className={trackColor} />
      </svg>
      <div className="motion-reduce:animate-none absolute top-1/2 left-0 w-16 -translate-y-[62%] animate-train-travel">
        <TrainSilhouette className={`h-7 w-16 ${trainColor}`} />
      </div>
    </div>
  );
}

function TrainSilhouette({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 28" fill="none" className={className}>
      <path
        d="M4 24V12a4 4 0 0 1 4-4h38l14 10v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"
        fill="currentColor"
      />
      <rect x="12" y="11" width="9" height="7" rx="1" className="fill-stone-50" opacity="0.9" />
      <rect x="25" y="11" width="9" height="7" rx="1" className="fill-stone-50" opacity="0.9" />
      <circle cx="14" cy="25" r="3" fill="currentColor" />
      <circle cx="30" cy="25" r="3" fill="currentColor" />
      <circle cx="48" cy="25" r="3" fill="currentColor" />
      <rect x="0" y="21" width="6" height="3" rx="1" fill="currentColor" />
    </svg>
  );
}
