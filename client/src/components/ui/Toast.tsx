import { useEffect } from 'react';
import { useToastStore } from '@/store/toastStore';

const TONE_CLASSES: Record<'success' | 'danger' | 'neutral', string> = {
  success: 'border-sage-200 bg-sage-50 text-sage-700',
  danger: 'border-rust-100 bg-rust-50 text-rust-600',
  neutral: 'border-warmgray-200 bg-white text-ink-800',
};

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6">
      {toasts.map((item) => (
        <ToastRow key={item.id} id={item.id} tone={item.tone} message={item.message} onDismiss={dismiss} />
      ))}
    </div>
  );
}

function ToastRow({
  id,
  tone,
  message,
  onDismiss,
}: {
  id: string;
  tone: 'success' | 'danger' | 'neutral';
  message: string;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 4000);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <div
      role="status"
      className={`pointer-events-auto w-full max-w-sm rounded-md border px-4 py-3 text-sm shadow-raised sm:w-auto ${TONE_CLASSES[tone]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p>{message}</p>
        <button
          onClick={() => onDismiss(id)}
          aria-label="Dismiss"
          className="shrink-0 text-current opacity-50 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
