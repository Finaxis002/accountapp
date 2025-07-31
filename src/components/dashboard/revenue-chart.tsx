'use client';

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

const data = [
  { month: 'Jan', revenue: 45000 },
  { month: 'Feb', revenue: 52000 },
  { month: 'Mar', revenue: 48000 },
  { month: 'Apr', revenue: 60000 },
  { month: 'May', revenue: 55000 },
  { month: 'Jun', revenue: 72000 },
  { month: 'Jul', revenue: 80000 },
];

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function RevenueChart() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <LineChart 
        data={data}
        margin={{
            top: 5,
            right: 20,
            left: -10,
            bottom: 5,
        }}
    >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
        <XAxis
          dataKey="month"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value / 1000}k`}
        />
        <Tooltip
          cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2, strokeDasharray: '3 3' }}
          content={<ChartTooltipContent 
            formatter={(value, name) => (`$${value.toLocaleString()}`)}
          />}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{
            r: 4,
            fill: "hsl(var(--primary))",
            stroke: "hsl(var(--background))",
            strokeWidth: 2,
          }}
        />
      </LineChart>
    </ChartContainer>
  );
}
