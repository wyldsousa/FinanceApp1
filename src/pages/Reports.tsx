import { useState, useMemo, useRef } from 'react';
import { FileText, Download, Calendar, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useInvestments } from '@/hooks/useInvestments';
import { CustomPieChart, CustomBarChart } from '@/components/ChartComponents';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function Reports() {
  const { user } = useAuth();
  const { transactions } = useTransactions(user?.id);
  const { investments, getSummary } = useInvestments(user?.id);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [period, setPeriod] = useState('thisMonth');
  const [activeTab, setActiveTab] = useState('financial');

  const periodDates = useMemo(() => {
    const now = new Date();
    switch (period) {
      case 'thisMonth':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'last3Months':
        return { start: startOfMonth(subMonths(now, 3)), end: endOfMonth(now) };
      case 'last6Months':
        return { start: startOfMonth(subMonths(now, 6)), end: endOfMonth(now) };
      case 'thisYear':
        return { start: new Date(now.getFullYear(), 0, 1), end: endOfMonth(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [period]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
      isWithinInterval(new Date(t.date), { start: periodDates.start, end: periodDates.end })
    );
  }, [transactions, periodDates]);

  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const byCategory = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const categoryData = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value, color: '#' + Math.floor(Math.random()*16777215).toString(16) }))
      .sort((a, b) => b.value - a.value);

    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthTransactions = transactions.filter(t => 
        isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
      );
      
      monthlyData.push({
        name: format(date, 'MMM', { locale: ptBR }),
        income: monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        expense: monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
      });
    }

    return { income, expense, balance: income - expense, byCategory: categoryData, monthlyData };
  }, [filteredTransactions, transactions]);

  const investmentStats = useMemo(() => getSummary(), [getSummary]);

  const generatePDF = async () => {
    if (!reportRef.current) return;

    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      backgroundColor: '#0f172a'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`relatorio-financas-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'thisMonth': return 'Este Mês';
      case 'lastMonth': return 'Mês Passado';
      case 'last3Months': return 'Últimos 3 Meses';
      case 'last6Months': return 'Últimos 6 Meses';
      case 'thisYear': return 'Este Ano';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Relatórios</h1>
          <p className="text-slate-400">Gere relatórios detalhados das suas finanças</p>
        </div>
        <div className="flex gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-700">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="thisMonth">Este Mês</SelectItem>
              <SelectItem value="lastMonth">Mês Passado</SelectItem>
              <SelectItem value="last3Months">Últimos 3 Meses</SelectItem>
              <SelectItem value="last6Months">Últimos 6 Meses</SelectItem>
              <SelectItem value="thisYear">Este Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={generatePDF} className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-800">
          <TabsTrigger value="financial" className="data-[state=active]:bg-slate-700">
            <BarChart3 className="w-4 h-4 mr-2" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="investments" className="data-[state=active]:bg-slate-700">
            <TrendingUp className="w-4 h-4 mr-2" />
            Investimentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="mt-6">
          <div ref={reportRef} className="space-y-6 bg-slate-950 p-6 rounded-lg">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white">Relatório Financeiro</h2>
              <p className="text-slate-400">{getPeriodLabel()} - {format(new Date(), 'dd/MM/yyyy')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Total Receitas</p>
                      <p className="text-xl font-bold text-green-500">{formatCurrency(stats.income)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Total Despesas</p>
                      <p className="text-xl font-bold text-red-500">{formatCurrency(stats.expense)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Saldo</p>
                      <p className={`text-xl font-bold ${stats.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatCurrency(stats.balance)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Evolução Mensal</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomBarChart data={stats.monthlyData} height={250} />
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Despesas por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.byCategory.length > 0 ? (
                    <CustomPieChart data={stats.byCategory} height={250} />
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-slate-500">
                      Nenhuma despesa no período
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Detalhamento por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.byCategory.map((cat, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-white">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-400">
                          {((cat.value / stats.expense) * 100).toFixed(1)}%
                        </span>
                        <span className="text-white font-medium">{formatCurrency(cat.value)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="investments" className="mt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-6">
                  <p className="text-sm text-slate-400">Total Investido</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(investmentStats.totalInvested)}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-6">
                  <p className="text-sm text-slate-400">Valor Atual</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(investmentStats.currentValue)}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-6">
                  <p className="text-sm text-slate-400">Lucro/Prejuízo</p>
                  <p className={`text-xl font-bold ${investmentStats.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {investmentStats.profitLoss >= 0 ? '+' : ''}{formatCurrency(investmentStats.profitLoss)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-6">
                  <p className="text-sm text-slate-400">Rentabilidade</p>
                  <p className={`text-xl font-bold ${investmentStats.profitLossPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {investmentStats.profitLossPercentage >= 0 ? '+' : ''}{investmentStats.profitLossPercentage.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Carteira de Investimentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {investments.length > 0 ? (
                    investments.map((inv) => {
                      const profitLoss = inv.currentValue - inv.totalInvested;
                      const profitLossPercent = inv.totalInvested > 0 ? (profitLoss / inv.totalInvested) * 100 : 0;
                      
                      return (
                        <div key={inv.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                          <div>
                            <p className="text-white font-medium">{inv.name}</p>
                            <p className="text-sm text-slate-400">{inv.ticker} • {inv.broker}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-medium">{formatCurrency(inv.currentValue)}</p>
                            <p className={`text-sm ${profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)} ({profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%)
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      Nenhum investimento registrado
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
