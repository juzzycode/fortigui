import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  selectable?: boolean;
  selected?: string[];
  onToggle?: (id: string) => void;
}

export const DataTable = <T,>({ data, columns, keyExtractor, selectable, selected = [], onToggle }: DataTableProps<T>) => (
  <div className="overflow-hidden rounded-3xl border border-border">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border text-left">
        <thead className="bg-soft/80">
          <tr>
            {selectable ? <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Pick</th> : null}
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {data.map((item) => {
            const id = keyExtractor(item);
            return (
              <tr key={id} className="transition hover:bg-soft/50">
                {selectable ? (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(id)}
                      onChange={() => onToggle?.(id)}
                      className={cn('h-4 w-4 rounded border-border bg-soft text-accent focus:ring-accent')}
                    />
                  </td>
                ) : null}
                {columns.map((column) => (
                  <td key={column.key} className={cn('px-4 py-3 align-top text-sm text-text', column.className)}>
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);
