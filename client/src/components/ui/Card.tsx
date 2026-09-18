import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'sm' | 'md';
}

const PADDING_CLASSES: Record<'sm' | 'md', string> = {
  sm: 'p-4',
  md: 'p-5 sm:p-6',
};

export function Card({ children, padding = 'md', className = '', ...rest }: CardProps) {
  return (
    <div
      className={`rounded-md border border-warmgray-200 bg-white shadow-xs ${PADDING_CLASSES[padding]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
