import type { ReactNode } from 'react';

interface ErrorStateProps {
  title?: string;
  description: string;
  action?: ReactNode;
}

export function ErrorState({ title = 'Something went wrong', description, action }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-rust-100 bg-rust-50 px-6 py-10 text-center">
      <AlertIcon className="mb-1 h-6 w-6 text-rust-500" />
      <p className="text-sm font-medium text-rust-600">{title}</p>
      <p className="max-w-sm text-sm text-ink-500">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

function AlertIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v4m0 3.5h.01M10.3 3.9L2.7 17a1.5 1.5 0 001.3 2.25h16a1.5 1.5 0 001.3-2.25L13.7 3.9a1.5 1.5 0 00-2.6 0z"
      />
    </svg>
  );
}
