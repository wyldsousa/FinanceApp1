import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart
} from 'recharts';

interface PieChartProps {
  data: { name: string; value: number; color: string }[];
  height?: number;
}

export function CustomPieChart({ data, height = 300 }: PieChartProps) {
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);
  // Use total to avoid unused variable warning
  console.log('Total:', total);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#fff'
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => (
            <span style={{ color: '#94a3b8' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface BarChartProps {
  data: { name: string; income: number; expense: number }[];
  height?: number;
}

export function CustomBarChart({ data, height = 300 }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis 
          dataKey="name" 
          stroke="#64748b"
          tick={{ fill: '#94a3b8', fontSize: 12 }}
        />
        <YAxis 
          stroke="#64748b"
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          tickFormatter={(value) => `R$ ${value}`}
        />
        <Tooltip
          formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#fff'
          }}
        />
        <Legend 
          formatter={(value) => (
            <span style={{ color: '#94a3b8' }}>
              {value === 'income' ? 'Receitas' : 'Despesas'}
            </span>
          )}
        />
        <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface LineChartProps {
  data: { name: string; value: number }[];
  height?: number;
  color?: string;
}

export function CustomLineChart({ data, height = 300, color = '#3b82f6' }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis 
          dataKey="name" 
          stroke="#64748b"
          tick={{ fill: '#94a3b8', fontSize: 12 }}
        />
        <YAxis 
          stroke="#64748b"
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          tickFormatter={(value) => `R$ ${value}`}
        />
        <Tooltip
          formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#fff'
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          fill={`url(#gradient-${color})`}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface InvestmentChartProps {
  data: { type: string; invested: number; current: number }[];
  height?: number;
}

export function InvestmentChart({ data, height = 300 }: InvestmentChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis 
          dataKey="type" 
          stroke="#64748b"
          tick={{ fill: '#94a3b8', fontSize: 12 }}
        />
        <YAxis 
          stroke="#64748b"
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          tickFormatter={(value) => `R$ ${value}`}
        />
        <Tooltip
          formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#fff'
          }}
        />
        <Legend 
          formatter={(value) => (
            <span style={{ color: '#94a3b8' }}>
              {value === 'invested' ? 'Investido' : 'Atual'}
            </span>
          )}
        />
        <Bar dataKey="invested" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="current" fill="#22c55e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
