import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const ActionButton = ({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn(
      'focus-ring inline-flex items-center justify-center rounded-2xl border border-border bg-soft px-4 py-2 text-sm font-medium text-text transition hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:text-text',
      className,
    )}
    {...props}
  />
);
