import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

const tones = ['var(--color-success)', 'var(--color-warning)', 'var(--color-danger)', 'var(--color-offline)'];

export const HealthDonut = ({ data }: { data: Array<{ name: string; value: number }> }) => (
  <div className="h-56 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie innerRadius={60} outerRadius={84} paddingAngle={4} data={data} dataKey="value">
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={tones[index % tones.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  </div>
);
