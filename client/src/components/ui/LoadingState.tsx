import { Spinner } from './Spinner';

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <Spinner />
      <p className="text-sm text-ink-400">{label}</p>
    </div>
  );
}
