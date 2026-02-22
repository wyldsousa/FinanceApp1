import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon: React.ReactNode;
  color: 'green' | 'red' | 'blue' | 'purple' | 'orange';
}

const bgColorMap = {
  green: 'bg-emerald-500/10',
  red: 'bg-rose-500/10',
  blue: 'bg-blue-500/10',
  purple: 'bg-violet-500/10',
  orange: 'bg-orange-500/10'
};

const iconColorMap = {
  green: 'text-emerald-500',
  red: 'text-rose-500',
  blue: 'text-blue-500',
  purple: 'text-violet-500',
  orange: 'text-orange-500'
};

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  trendValue, 
  icon,
  color 
}: StatCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-slate-500';

  return (
    <Card className="bg-slate-900 border-slate-800 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 ${bgColorMap[color]} rounded-xl flex items-center justify-center`}>
            <div className={iconColorMap[color]}>
              {icon}
            </div>
          </div>
          {trend && (
            <div className={`flex items-center gap-1 ${trendColor}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{trendValue}</span>
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-slate-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
