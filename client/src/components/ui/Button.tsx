import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'accent' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-ink-900 text-stone-50 hover:bg-ink-800 disabled:bg-ink-300',
  // terracotta-600, not -500: white text on -500 falls just under WCAG AA
  // contrast (4.5:1) for this button's font weight/size — -600 clears it.
  accent: 'bg-terracotta-600 text-white hover:bg-terracotta-700 disabled:bg-terracotta-200',
  secondary:
    'border border-warmgray-300 bg-white text-ink-800 hover:border-ink-400 hover:bg-stone-50 disabled:text-ink-300',
  danger: 'bg-rust-500 text-white hover:bg-rust-600 disabled:bg-rust-100 disabled:text-rust-300',
  ghost: 'bg-transparent text-ink-700 hover:bg-stone-200 disabled:text-ink-300',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium tracking-wide transition-colors disabled:cursor-not-allowed ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
