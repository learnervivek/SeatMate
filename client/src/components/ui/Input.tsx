import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = '', ...rest }, ref) => {
    const generatedId = useId();
    // Falls back to a generated id so the <label>/<input> association never
    // silently breaks for a caller that passes neither `id` nor `name`.
    const fieldId = id ?? rest.name ?? generatedId;
    const hintId = hint ? `${fieldId}-hint` : undefined;
    const errorId = error ? `${fieldId}-error` : undefined;
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId} className="text-sm font-medium text-ink-700">
          {label}
        </label>
        <input
          id={fieldId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId ?? hintId}
          className={`rounded-md border bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 outline-none transition-colors focus:border-terracotta-500 ${
            error ? 'border-rust-500' : 'border-warmgray-300'
          } ${className}`}
          {...rest}
        />
        {hint && !error && (
          <p id={hintId} className="text-xs text-ink-400">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs text-rust-500">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';
