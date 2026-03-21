import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { BandwidthPoint } from '@/types/models';

export const UsageAreaChart = ({ data }: { data: BandwidthPoint[] }) => (
  <div className="h-72 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="inboundFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.45} />
            <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0.03} />
          </linearGradient>
          <linearGradient id="outboundFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
        <XAxis dataKey="interval" tickLine={false} axisLine={false} tick={{ fill: 'var(--color-muted)', fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--color-muted)', fontSize: 12 }} />
        <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16 }} />
        <Area type="monotone" dataKey="inbound" stroke="var(--color-accent)" fill="url(#inboundFill)" strokeWidth={2.5} />
        <Area type="monotone" dataKey="outbound" stroke="#38bdf8" fill="url(#outboundFill)" strokeWidth={2.5} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);
