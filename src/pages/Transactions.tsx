import { useState, useMemo } from 'react';
import { Plus, Search, Filter, ArrowUpRight, ArrowDownRight, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useCards } from '@/hooks/useCards';
import { useBanks } from '@/hooks/useBanks';
import { format, isSameMonth } from 'date-fns';

export function Transactions() {
  const { user } = useAuth();
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactions(user?.id);
  const { categories } = useCategories(user?.id);
  const { cards } = useCards(user?.id);
  const { accounts } = useBanks(user?.id);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    category: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    paymentMethod: 'cash',
    cardId: '',
    bankAccountId: ''
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, searchTerm, filterType, filterCategory]);

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const monthTransactions = transactions.filter(t => isSameMonth(new Date(t.date), now));
    
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { income, expense };
  }, [transactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      userId: user!.id,
      type: formData.type,
      amount: parseFloat(formData.amount),
      description: formData.description,
      category: formData.category,
      date: new Date(formData.date),
      paymentMethod: formData.paymentMethod as 'cash' | 'credit' | 'debit' | 'pix' | 'transfer',
      cardId: formData.cardId || undefined,
      bankAccountId: formData.bankAccountId || (accounts.length > 0 ? accounts[0].id : '')
    };

    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, data);
      } else {
        await addTransaction(data);
      }
      
      setIsDialogOpen(false);
      setEditingTransaction(null);
      setFormData({
        type: 'expense',
        amount: '',
        description: '',
        category: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: 'cash',
        cardId: '',
        bankAccountId: accounts.length > 0 ? accounts[0].id : ''
      });
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: transaction.description,
      category: transaction.category,
      date: format(new Date(transaction.date), 'yyyy-MM-dd'),
      paymentMethod: transaction.paymentMethod || 'cash',
      cardId: transaction.cardId || '',
      bankAccountId: transaction.bankAccountId || (accounts.length > 0 ? accounts[0].id : '')
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (transaction: any) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        await deleteTransaction(transaction);
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transações</h1>
          <p className="text-slate-400">Gerencie suas receitas e despesas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
              setEditingTransaction(null);
              setFormData({
                type: 'expense',
                amount: '',
                description: '',
                category: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                paymentMethod: 'cash',
                cardId: '',
                bankAccountId: accounts.length > 0 ? accounts[0].id : ''
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTransaction ? 'Editar' : 'Nova'} Transação</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(v) => setFormData({...formData, type: v as 'income' | 'expense', category: ''})}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="bg-slate-800 border-slate-700"
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  placeholder="Descrição da transação"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {(formData.type === 'income' ? incomeCategories : expenseCategories).map(c => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="bg-slate-800 border-slate-700"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <Select value={formData.paymentMethod} onValueChange={(v) => setFormData({...formData, paymentMethod: v})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="credit">Cartão de Crédito</SelectItem>
                      <SelectItem value="debit">Cartão de Débito</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="transfer">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.paymentMethod === 'credit' && (
                <div className="space-y-2">
                  <Label>Cartão</Label>
                  <Select value={formData.cardId} onValueChange={(v) => setFormData({...formData, cardId: v})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {cards.filter(c => c.type === 'credit').map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {editingTransaction ? 'Salvar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Receitas do Mês</p>
                <p className="text-2xl font-bold text-green-500">{formatCurrency(monthlyStats.income)}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Despesas do Mês</p>
                <p className="text-2xl font-bold text-red-500">{formatCurrency(monthlyStats.expense)}</p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <ArrowDownRight className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700"
              />
            </div>
            <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
              <SelectTrigger className="w-full md:w-40 bg-slate-800 border-slate-700">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-700">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">Todas categorias</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-4">
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
                      <p className="text-sm text-slate-400">{t.category} • {format(new Date(t.date), 'dd/MM/yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`font-medium ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(t)}>
                        <Edit2 className="w-4 h-4 text-slate-400" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(t)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-500">
                Nenhuma transação encontrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
