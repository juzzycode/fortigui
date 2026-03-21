import { Bar, BarChart, ResponsiveContainer } from 'recharts';

export const BarSpark = ({ dataKey, data }: { dataKey: string; data: Record<string, number>[] }) => (
  <div className="h-16 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <Bar dataKey={dataKey} fill="var(--color-accent)" radius={[10, 10, 4, 4]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
