export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-sm bg-stone-200 ${className}`} aria-hidden="true" />;
}
