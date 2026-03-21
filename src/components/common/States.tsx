export const LoadingState = ({ label = 'Loading data...' }: { label?: string }) => (
  <div className="panel flex min-h-48 items-center justify-center p-6 text-subtle">{label}</div>
);

export const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="panel flex min-h-48 flex-col items-center justify-center p-6 text-center">
    <h3 className="text-lg font-semibold text-text">{title}</h3>
    <p className="mt-2 max-w-md text-subtle">{description}</p>
  </div>
);

export const ErrorState = ({ title, description }: { title: string; description: string }) => (
  <div className="panel flex min-h-48 flex-col items-center justify-center border-danger/25 p-6 text-center">
    <h3 className="text-lg font-semibold text-danger">{title}</h3>
    <p className="mt-2 max-w-md text-subtle">{description}</p>
  </div>
);
