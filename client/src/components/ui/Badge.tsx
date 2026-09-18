import type { ReactNode } from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'accent';

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-stone-100 text-ink-600 border-warmgray-200',
  success: 'bg-sage-50 text-sage-700 border-sage-200',
  warning: 'bg-amber-50 text-amber-600 border-amber-100',
  danger: 'bg-rust-50 text-rust-600 border-rust-100',
  accent: 'bg-terracotta-50 text-terracotta-600 border-terracotta-100',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}
