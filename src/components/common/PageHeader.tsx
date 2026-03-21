import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export const PageHeader = ({ eyebrow, title, description, actions }: PageHeaderProps) => (
  <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div>
      {eyebrow ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-accent">{eyebrow}</p> : null}
      <h1 className="text-3xl font-semibold text-text">{title}</h1>
      <p className="mt-2 max-w-3xl text-subtle">{description}</p>
    </div>
    {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
  </div>
);
