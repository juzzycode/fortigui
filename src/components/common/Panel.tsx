import type { PropsWithChildren, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PanelProps extends PropsWithChildren {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export const Panel = ({ title, subtitle, action, className, children }: PanelProps) => (
  <section className={cn('panel p-5', className)}>
    {(title || action) && (
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          {title ? <h3 className="panel-title">{title}</h3> : null}
          {subtitle ? <p className="mt-1 text-subtle">{subtitle}</p> : null}
        </div>
        {action}
      </div>
    )}
    {children}
  </section>
);
