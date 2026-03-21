import type { PropsWithChildren, ReactNode } from 'react';
import { X } from 'lucide-react';

interface SideDrawerProps extends PropsWithChildren {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  actions?: ReactNode;
}

export const SideDrawer = ({ open, title, subtitle, onClose, actions, children }: SideDrawerProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 w-full max-w-xl border-l border-border bg-canvas p-5 shadow-2xl">
        <div className="panel h-full overflow-y-auto p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-text">{title}</h3>
              {subtitle ? <p className="mt-1 text-subtle">{subtitle}</p> : null}
            </div>
            <button className="focus-ring rounded-2xl border border-border p-2 text-muted hover:text-text" onClick={onClose}>
              <X className="h-4 w-4" />
            </button>
          </div>
          {actions ? <div className="mb-4 flex flex-wrap gap-3">{actions}</div> : null}
          {children}
        </div>
      </div>
    </div>
  );
};
