import type { SelectHTMLAttributes } from 'react';
import { forwardRef, useId } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, id, className = '', ...rest }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? rest.name ?? generatedId;
    const errorId = error ? `${fieldId}-error` : undefined;
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId} className="text-sm font-medium text-ink-700">
          {label}
        </label>
        <div className="relative">
          <select
            id={fieldId}
            ref={ref}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className={`w-full appearance-none rounded-md border bg-white px-3 py-2.5 pr-9 text-sm text-ink-900 outline-none transition-colors focus:border-terracotta-500 ${
              error ? 'border-rust-500' : 'border-warmgray-300'
            } ${className}`}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-xs text-rust-500">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Select.displayName = 'Select';

function ChevronIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 7.5L10 12l4.5-4.5" />
    </svg>
  );
}
