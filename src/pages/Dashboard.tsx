import { useMemo } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StatCard } from '@/components/StatCard';
import { CustomPieChart, CustomBarChart } from '@/components/ChartComponents';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useCards } from '@/hooks/useCards';
import { useInvestments } from '@/hooks/useInvestments';
import { useReminders } from '@/hooks/useReminders';
import { useCategories } from '@/hooks/useCategories';
import { useBanks } from '@/hooks/useBanks';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function Dashboard() {
  const { user } = useAuth();
  const { transactions } = useTransactions(user?.id);
  const { getTotalCreditLimit, getTotalCreditUsed } = useCards(user?.id);
  const { getSummary: getInvestmentSummary } = useInvestments(user?.id);
  const { getUpcoming } = useReminders(user?.id);
  const { categories } = useCategories(user?.id);
  const { getTotalBalance } = useBanks(user?.id);

  // Monthly data
  const monthlyData = useMemo(() => {
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthTransactions = transactions.filter(t => 
        isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
      );
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
        
      const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      months.push({
        name: format(date, 'MMM', { locale: ptBR }),
        income,
        expense
      });
    }
    
    return months;
  }, [transactions]);

  // Current month stats
  const currentMonthStats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const monthTransactions = transactions.filter(t => 
      isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
    );
    
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { income, expense, balance: income - expense };
  }, [transactions]);

  // Total balance from bank accounts
  const totalBalance = useMemo(() => getTotalBalance(), [getTotalBalance]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const expenseByCategory = new Map<string, number>();
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const current = expenseByCategory.get(t.category) || 0;
        expenseByCategory.set(t.category, current + t.amount);
      });

    return Array.from(expenseByCategory.entries())
      .map(([name, value]) => {
        const category = categories.find(c => c.name === name);
        return {
          name,
          value,
          color: category?.color || '#64748b'
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [transactions, categories]);

  // Investment summary
  const invSummary = useMemo(() => getInvestmentSummary(), [getInvestmentSummary]);

  // Credit card usage
  const creditLimit = useMemo(() => getTotalCreditLimit(), [getTotalCreditLimit]);
  const creditUsed = useMemo(() => getTotalCreditUsed(), [getTotalCreditUsed]);
  const creditUsagePercent = creditLimit > 0 ? (creditUsed / creditLimit) * 100 : 0;

  // Recent transactions
  const recentTransactions = useMemo(() => 
    transactions.slice(0, 5), 
    [transactions]
  );

  // Upcoming reminders
  const upcomingReminders = useMemo(() => 
    getUpcoming(7), 
    [getUpcoming]
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400">Resumo das suas finanças</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Saldo Total"
          value={formatCurrency(totalBalance)}
          subtitle="Saldo acumulado"
          trend={totalBalance >= 0 ? 'up' : 'down'}
          icon={<Wallet className="w-6 h-6" />}
          color={totalBalance >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Receitas do Mês"
          value={formatCurrency(currentMonthStats.income)}
          subtitle={format(new Date(), 'MMMM yyyy', { locale: ptBR })}
          trend="up"
          icon={<TrendingUp className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Despesas do Mês"
          value={formatCurrency(currentMonthStats.expense)}
          subtitle={format(new Date(), 'MMMM yyyy', { locale: ptBR })}
          trend="down"
          icon={<TrendingDown className="w-6 h-6" />}
          color="red"
        />
        <StatCard
          title="Investimentos"
          value={formatCurrency(invSummary.currentValue)}
          subtitle={`${invSummary.profitLoss >= 0 ? '+' : ''}${invSummary.profitLossPercentage.toFixed(2)}%`}
          trend={invSummary.profitLoss >= 0 ? 'up' : 'down'}
          icon={<PiggyBank className="w-6 h-6" />}
          color="blue"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Receitas vs Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomBarChart data={monthlyData} height={250} />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <CustomPieChart data={categoryData} height={250} />
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-500">
                Nenhuma despesa registrada
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Credit Cards & Investments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Uso do Cartão de Crédito
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Utilizado</span>
              <span className="text-white font-medium">{formatCurrency(creditUsed)}</span>
            </div>
            <Progress value={creditUsagePercent} className="h-2" />
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Limite total</span>
              <span className="text-white font-medium">{formatCurrency(creditLimit)}</span>
            </div>
            <p className="text-xs text-slate-500">
              {creditUsagePercent.toFixed(1)}% do limite utilizado
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Resumo de Investimentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400">Total Investido</p>
                <p className="text-lg font-semibold text-white">{formatCurrency(invSummary.totalInvested)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Valor Atual</p>
                <p className="text-lg font-semibold text-white">{formatCurrency(invSummary.currentValue)}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800">
              <p className="text-sm text-slate-400">Lucro/Prejuízo</p>
              <p className={`text-lg font-semibold ${invSummary.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {invSummary.profitLoss >= 0 ? '+' : ''}{formatCurrency(invSummary.profitLoss)}
                <span className="text-sm ml-2">({invSummary.profitLossPercentage >= 0 ? '+' : ''}{invSummary.profitLossPercentage.toFixed(2)}%)</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions & Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Transações Recentes</CardTitle>
            <Button variant="ghost" size="sm" className="text-blue-500" asChild>
              <a href="/transactions">Ver todas</a>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        t.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        {t.type === 'income' ? (
                          <ArrowUpRight className="w-5 h-5 text-green-500" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{t.description}</p>
                        <p className="text-sm text-slate-400">{t.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(t.date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  Nenhuma transação registrada
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Lembretes Próximos</CardTitle>
            <Button variant="ghost" size="sm" className="text-blue-500" asChild>
              <a href="/reminders">Ver todos</a>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingReminders.length > 0 ? (
                upcomingReminders.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{r.title}</p>
                      <p className="text-sm text-slate-400">{r.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-white">{formatCurrency(r.amount)}</p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(r.dueDate), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  Nenhum lembrete próximo
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
