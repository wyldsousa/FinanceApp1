import { useState } from 'react';
import { 
  Plus, 
  Building2, 
  Edit2, 
  Trash2,
  Wallet,
  PiggyBank,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useBanks } from '@/hooks/useBanks';
import type { BankAccount } from '@/types';

const accountTypeIcons = {
  checking: Wallet,
  savings: PiggyBank,
  digital: Smartphone
};

const accountTypeLabels = {
  checking: 'Conta Corrente',
  savings: 'Conta Poupança',
  digital: 'Conta Digital'
};

const accountColors = [
  '#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444', '#14b8a6'
];

export function Banks() {
  const { user } = useAuth();
  const { accounts, loading, addAccount, updateAccount, deleteAccount, getTotalBalance } = useBanks(user?.id);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    balance: '',
    type: 'checking' as 'checking' | 'savings' | 'digital',
    color: '#3b82f6'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) return;

    const accountData = {
      userId: user.id,
      name: formData.name,
      balance: parseFloat(formData.balance) || 0,
      type: formData.type,
      color: formData.color,
      isActive: true
    };

    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, {
          name: formData.name,
          type: formData.type,
          color: formData.color
        });
      } else {
        await addAccount(accountData);
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving account:', error);
    }
  };

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      balance: account.balance.toString(),
      type: account.type,
      color: account.color
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (accountId: string) => {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      try {
        await deleteAccount(accountId);
      } catch (error) {
        console.error('Error deleting account:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      balance: '',
      type: 'checking',
      color: '#3b82f6'
    });
    setEditingAccount(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Contas Bancárias</h1>
          <p className="text-slate-400">Gerencie suas contas e saldos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle>{editingAccount ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Conta</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Banco do Brasil"
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>

              {!editingAccount && (
                <div className="space-y-2">
                  <Label htmlFor="balance">Saldo Inicial</Label>
                  <Input
                    id="balance"
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    placeholder="0,00"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Conta</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'checking' | 'savings' | 'digital') => 
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="checking">Conta Corrente</SelectItem>
                    <SelectItem value="savings">Conta Poupança</SelectItem>
                    <SelectItem value="digital">Conta Digital</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {accountColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full transition-all ${
                        formData.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-slate-700 text-white hover:bg-slate-800"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {editingAccount ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Total Balance Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Saldo Total em Contas</p>
              <p className="text-3xl font-bold text-white mt-1">
                {formatCurrency(getTotalBalance())}
              </p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-8 text-center">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Nenhuma conta cadastrada</p>
            <p className="text-slate-500 text-sm mt-1">
              Clique em "Nova Conta" para adicionar sua primeira conta bancária
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => {
            const Icon = accountTypeIcons[account.type];
            return (
              <Card 
                key={account.id} 
                className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${account.color}20` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: account.color }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{account.name}</h3>
                        <p className="text-sm text-slate-400">{accountTypeLabels[account.type]}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-white"
                        onClick={() => handleEdit(account)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-400"
                        onClick={() => handleDelete(account.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <p className="text-sm text-slate-400">Saldo atual</p>
                    <p className={`text-2xl font-bold ${account.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(account.balance)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
