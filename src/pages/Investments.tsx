import { useState, useMemo } from 'react';
import { Plus, TrendingUp, TrendingDown, Edit2, Trash2, PieChart, ArrowUpCircle, ArrowDownCircle, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { InvestmentChart } from '@/components/ChartComponents';
import { useInvestments } from '@/hooks/useInvestments';
import { useBanks } from '@/hooks/useBanks';
import { format } from 'date-fns';

const investmentTypes = [
  { value: 'stocks', label: 'Ações', color: '#3b82f6' },
  { value: 'fiis', label: 'FIIs', color: '#8b5cf6' },
  { value: 'crypto', label: 'Criptomoedas', color: '#f97316' },
  { value: 'fixed_income', label: 'Renda Fixa', color: '#22c55e' },
  { value: 'treasury', label: 'Tesouro', color: '#14b8a6' },
  { value: 'other', label: 'Outros', color: '#64748b' }
];

export function Investments() {
  const { user } = useAuth();
  const { 
    investments, 
    addInvestment, 
    updateInvestment, 
    deleteInvestment, 
    depositToInvestment,
    withdrawFromInvestment,
    getSummary, 
    getByType,
    getInvestmentTransactions
  } = useInvestments(user?.id);
  const { accounts } = useBanks(user?.id);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<any>(null);
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'stocks' as 'stocks' | 'fiis' | 'crypto' | 'fixed_income' | 'treasury' | 'other',
    ticker: '',
    quantity: '',
    averagePrice: '',
    currentPrice: '',
    broker: '',
    purchaseDate: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    bankAccountId: ''
  });

  const [depositForm, setDepositForm] = useState({
    investmentId: '',
    amount: '',
    bankAccountId: ''
  });

  const [withdrawForm, setWithdrawForm] = useState({
    investmentId: '',
    amount: '',
    bankAccountId: ''
  });

  const summary = useMemo(() => getSummary(), [getSummary]);
  const byType = useMemo(() => getByType(), [getByType]);

  const chartData = useMemo(() => {
    return byType.map(t => ({
      type: investmentTypes.find(it => it.value === t.type)?.label || t.type,
      invested: t.totalInvested,
      current: t.currentValue
    }));
  }, [byType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      userId: user!.id,
      name: formData.name,
      type: formData.type,
      ticker: formData.ticker,
      quantity: parseFloat(formData.quantity),
      averagePrice: parseFloat(formData.averagePrice),
      currentPrice: parseFloat(formData.currentPrice),
      broker: formData.broker,
      purchaseDate: new Date(formData.purchaseDate),
      notes: formData.notes,
      bankAccountId: formData.bankAccountId || (accounts.length > 0 ? accounts[0].id : '')
    };

    try {
      if (editingInvestment) {
        await updateInvestment(editingInvestment.id, data);
      } else {
        await addInvestment(data);
      }
      
      setIsDialogOpen(false);
      setEditingInvestment(null);
      resetForm();
    } catch (error) {
      console.error('Error saving investment:', error);
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await depositToInvestment(
        depositForm.investmentId,
        parseFloat(depositForm.amount),
        depositForm.bankAccountId
      );
      
      setIsDepositDialogOpen(false);
      setDepositForm({ investmentId: '', amount: '', bankAccountId: '' });
    } catch (error) {
      console.error('Error depositing:', error);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await withdrawFromInvestment(
        withdrawForm.investmentId,
        parseFloat(withdrawForm.amount),
        withdrawForm.bankAccountId
      );
      
      setIsWithdrawDialogOpen(false);
      setWithdrawForm({ investmentId: '', amount: '', bankAccountId: '' });
    } catch (error) {
      console.error('Error withdrawing:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'stocks',
      ticker: '',
      quantity: '',
      averagePrice: '',
      currentPrice: '',
      broker: '',
      purchaseDate: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
      bankAccountId: accounts.length > 0 ? accounts[0].id : ''
    });
  };

  const handleEdit = (investment: any) => {
    setEditingInvestment(investment);
    setFormData({
      name: investment.name,
      type: investment.type,
      ticker: investment.ticker || '',
      quantity: investment.quantity.toString(),
      averagePrice: investment.averagePrice.toString(),
      currentPrice: investment.currentPrice.toString(),
      broker: investment.broker,
      purchaseDate: format(new Date(investment.purchaseDate), 'yyyy-MM-dd'),
      notes: investment.notes || '',
      bankAccountId: investment.bankAccountId || (accounts.length > 0 ? accounts[0].id : '')
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (investment: any) => {
    if (confirm('Tem certeza que deseja excluir este investimento? O valor será devolvido à conta bancária.')) {
      try {
        const bankAccountId = accounts.length > 0 ? accounts[0].id : investment.bankAccountId;
        await deleteInvestment(investment, bankAccountId);
      } catch (error) {
        console.error('Error deleting investment:', error);
      }
    }
  };

  const openDepositDialog = (investment: any) => {
    setSelectedInvestment(investment);
    setDepositForm({
      investmentId: investment.id,
      amount: '',
      bankAccountId: accounts.length > 0 ? accounts[0].id : ''
    });
    setIsDepositDialogOpen(true);
  };

  const openWithdrawDialog = (investment: any) => {
    setSelectedInvestment(investment);
    setWithdrawForm({
      investmentId: investment.id,
      amount: '',
      bankAccountId: accounts.length > 0 ? accounts[0].id : ''
    });
    setIsWithdrawDialogOpen(true);
  };

  const openHistoryDialog = (investment: any) => {
    setSelectedInvestment(investment);
    setIsHistoryDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const selectedInvestmentTransactions = selectedInvestment 
    ? getInvestmentTransactions(selectedInvestment.id)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Investimentos</h1>
          <p className="text-slate-400">Acompanhe sua carteira de investimentos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
              setEditingInvestment(null);
              resetForm();
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Investimento
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingInvestment ? 'Editar' : 'Novo'} Investimento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(v: any) => setFormData({...formData, type: v})}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {investmentTypes.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ticker/Código</Label>
                  <Input
                    value={formData.ticker}
                    onChange={(e) => setFormData({...formData, ticker: e.target.value.toUpperCase()})}
                    className="bg-slate-800 border-slate-700"
                    placeholder="PETR4"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nome do Ativo</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  placeholder="Ex: Petrobras"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="bg-slate-800 border-slate-700"
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço Médio</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.averagePrice}
                    onChange={(e) => setFormData({...formData, averagePrice: e.target.value})}
                    className="bg-slate-800 border-slate-700"
                    placeholder="0,00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço Atual</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.currentPrice}
                    onChange={(e) => setFormData({...formData, currentPrice: e.target.value})}
                    className="bg-slate-800 border-slate-700"
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Corretora</Label>
                  <Input
                    value={formData.broker}
                    onChange={(e) => setFormData({...formData, broker: e.target.value})}
                    className="bg-slate-800 border-slate-700"
                    placeholder="Ex: XP, Rico..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Conta Bancária</Label>
                  <Select 
                    value={formData.bankAccountId} 
                    onValueChange={(v) => setFormData({...formData, bankAccountId: v})}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {accounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Data da Compra</Label>
                <Input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  placeholder="Observações opcionais"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {editingInvestment ? 'Salvar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <p className="text-sm text-slate-400">Total Investido</p>
            <p className="text-xl font-bold text-white">{formatCurrency(summary.totalInvested)}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <p className="text-sm text-slate-400">Valor Atual</p>
            <p className="text-xl font-bold text-white">{formatCurrency(summary.currentValue)}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <p className="text-sm text-slate-400">Lucro/Prejuízo</p>
            <p className={`text-xl font-bold ${summary.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {summary.profitLoss >= 0 ? '+' : ''}{formatCurrency(summary.profitLoss)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <p className="text-sm text-slate-400">Rentabilidade</p>
            <p className={`text-xl font-bold ${summary.profitLossPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {summary.profitLossPercentage >= 0 ? '+' : ''}{summary.profitLossPercentage.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Distribuição por Tipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <InvestmentChart data={chartData} height={300} />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-500">
              Nenhum investimento registrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Investments List */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Carteira</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {investments.length > 0 ? (
              investments.map((inv) => {
                const profitLoss = inv.currentValue - inv.totalInvested;
                const profitLossPercent = inv.totalInvested > 0 ? (profitLoss / inv.totalInvested) * 100 : 0;
                
                return (
                  <div key={inv.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ 
                          backgroundColor: `${investmentTypes.find(t => t.value === inv.type)?.color}20` 
                        }}
                      >
                        {profitLoss >= 0 ? (
                          <TrendingUp className="w-6 h-6" style={{ 
                            color: investmentTypes.find(t => t.value === inv.type)?.color 
                          }} />
                        ) : (
                          <TrendingDown className="w-6 h-6" style={{ 
                            color: investmentTypes.find(t => t.value === inv.type)?.color 
                          }} />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{inv.name}</p>
                        <p className="text-sm text-slate-400">
                          {inv.ticker} • {investmentTypes.find(t => t.value === inv.type)?.label} • {inv.broker}
                        </p>
                        <p className="text-xs text-slate-500">
                          {inv.quantity} unid. × {formatCurrency(inv.averagePrice)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{formatCurrency(inv.currentValue)}</p>
                      <p className={`text-sm ${profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)} ({profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%)
                      </p>
                    </div>
                    <div className="flex gap-1 ml-4">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => openDepositDialog(inv)}
                        title="Aporte"
                      >
                        <ArrowUpCircle className="w-4 h-4 text-green-400" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => openWithdrawDialog(inv)}
                        title="Resgate"
                      >
                        <ArrowDownCircle className="w-4 h-4 text-orange-400" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => openHistoryDialog(inv)}
                        title="Histórico"
                      >
                        <History className="w-4 h-4 text-blue-400" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(inv)}>
                        <Edit2 className="w-4 h-4 text-slate-400" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(inv)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-slate-500">
                Nenhum investimento registrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Deposit Dialog */}
      <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Aporte</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDepositSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Investimento</Label>
              <Input value={selectedInvestment?.name || ''} disabled className="bg-slate-800 border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label>Valor do Aporte (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={depositForm.amount}
                onChange={(e) => setDepositForm({...depositForm, amount: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="0,00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Conta para Débito</Label>
              <Select 
                value={depositForm.bankAccountId} 
                onValueChange={(v) => setDepositForm({...depositForm, bankAccountId: v})}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} ({formatCurrency(acc.balance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDepositDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                Confirmar Aporte
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Resgate Parcial</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleWithdrawSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Investimento</Label>
              <Input value={selectedInvestment?.name || ''} disabled className="bg-slate-800 border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label>Valor do Resgate (R$)</Label>
              <Input
                type="number"
                step="0.01"
                max={selectedInvestment?.currentValue || 0}
                value={withdrawForm.amount}
                onChange={(e) => setWithdrawForm({...withdrawForm, amount: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="0,00"
                required
              />
              <p className="text-xs text-slate-400">
                Valor máximo: {formatCurrency(selectedInvestment?.currentValue || 0)}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Conta para Crédito</Label>
              <Select 
                value={withdrawForm.bankAccountId} 
                onValueChange={(v) => setWithdrawForm({...withdrawForm, bankAccountId: v})}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsWithdrawDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                Confirmar Resgate
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Movimentações</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedInvestmentTransactions.length > 0 ? (
              selectedInvestmentTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      t.type === 'deposit' ? 'bg-green-500/20' : 'bg-orange-500/20'
                    }`}>
                      {t.type === 'deposit' ? (
                        <ArrowUpCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <ArrowDownCircle className="w-5 h-5 text-orange-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {t.type === 'deposit' ? 'Aporte' : 'Resgate'}
                      </p>
                      {t.notes && <p className="text-xs text-slate-400">{t.notes}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${t.type === 'deposit' ? 'text-green-400' : 'text-orange-400'}`}>
                      {t.type === 'deposit' ? '+' : '-'}{formatCurrency(t.amount)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {format(new Date(t.date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                Nenhuma movimentação registrada
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
