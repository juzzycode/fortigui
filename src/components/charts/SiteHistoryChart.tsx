import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { SiteHistoryPoint } from '@/types/models';

export const SiteHistoryChart = ({ data }: { data: SiteHistoryPoint[] }) => (
  <div className="h-72 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
        <XAxis
          dataKey="observedAt"
          tickFormatter={(value) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric' }).format(new Date(value))}
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--color-muted)', fontSize: 12 }}
        />
        <YAxis yAxisId="counts" tickLine={false} axisLine={false} tick={{ fill: 'var(--color-muted)', fontSize: 12 }} />
        <YAxis yAxisId="latency" orientation="right" tickLine={false} axisLine={false} tick={{ fill: 'var(--color-muted)', fontSize: 12 }} />
        <Tooltip
          contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16 }}
          labelFormatter={(value) => new Date(String(value)).toLocaleString()}
        />
        <Legend />
        <Line yAxisId="counts" type="monotone" dataKey="clientCount" name="Clients" stroke="var(--color-accent)" strokeWidth={2.5} dot={false} />
        <Line yAxisId="counts" type="monotone" dataKey="switchCount" name="Switches" stroke="#38bdf8" strokeWidth={2} dot={false} />
        <Line yAxisId="counts" type="monotone" dataKey="apCount" name="APs" stroke="#f59e0b" strokeWidth={2} dot={false} />
        <Line yAxisId="latency" type="monotone" dataKey="latencyAvgMs" name="Latency ms" stroke="#ef4444" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);
