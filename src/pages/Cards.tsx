import { useState, useMemo } from 'react';
import { Plus, CreditCard, Edit2, Trash2, Eye, EyeOff, ShoppingCart, Receipt, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useCards } from '@/hooks/useCards';
import { useBanks } from '@/hooks/useBanks';
import { format } from 'date-fns';

const cardBrands = [
  { value: 'visa', label: 'Visa', color: '#1a1f71' },
  { value: 'mastercard', label: 'Mastercard', color: '#eb001b' },
  { value: 'amex', label: 'American Express', color: '#006fcf' },
  { value: 'elo', label: 'Elo', color: '#00a4e0' },
  { value: 'other', label: 'Outro', color: '#64748b' }
];

const cardColors = [
  { value: '#3b82f6', label: 'Azul' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#f97316', label: 'Laranja' },
  { value: '#22c55e', label: 'Verde' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#1e293b', label: 'Cinza' },
  { value: '#000000', label: 'Preto' }
];

export function Cards() {
  const { user } = useAuth();
  const { 
    cards, 
    installments, 
    addCard, 
    updateCard, 
    deleteCard, 
    createInstallmentPurchase, 
    payStatement,
    getTotalCreditLimit, 
    getTotalCreditUsed
  } = useCards(user?.id);
  const { accounts } = useBanks(user?.id);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [showNumber, setShowNumber] = useState<Record<string, boolean>>({});

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    type: 'credit' as 'credit' | 'debit',
    number: '',
    brand: 'visa' as 'visa' | 'mastercard' | 'amex' | 'elo' | 'other',
    limit: '',
    closingDay: '5',
    dueDay: '15',
    color: '#3b82f6'
  });

  const [purchaseForm, setPurchaseForm] = useState({
    cardId: '',
    description: '',
    totalAmount: '',
    totalInstallments: '1',
    firstDueDate: format(new Date(), 'yyyy-MM-dd')
  });

  const [paymentForm, setPaymentForm] = useState({
    cardId: '',
    amount: '',
    bankAccountId: ''
  });

  const creditCards = useMemo(() => cards.filter(c => c.type === 'credit'), [cards]);
  const debitCards = useMemo(() => cards.filter(c => c.type === 'debit'), [cards]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      userId: user!.id,
      name: formData.name,
      type: formData.type,
      number: formData.number.replace(/\s/g, ''),
      brand: formData.brand,
      limit: formData.type === 'credit' ? parseFloat(formData.limit) || 0 : 0,
      currentBalance: 0,
      availableLimit: formData.type === 'credit' ? parseFloat(formData.limit) || 0 : 0,
      closingDay: parseInt(formData.closingDay),
      dueDay: parseInt(formData.dueDay),
      color: formData.color,
      isActive: true
    };

    try {
      if (editingCard) {
        await updateCard(editingCard.id, data);
      } else {
        await addCard(data);
      }
      
      setIsDialogOpen(false);
      setEditingCard(null);
      resetForm();
    } catch (error) {
      console.error('Error saving card:', error);
    }
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createInstallmentPurchase(
        purchaseForm.cardId,
        purchaseForm.description,
        parseFloat(purchaseForm.totalAmount),
        parseInt(purchaseForm.totalInstallments),
        new Date(purchaseForm.firstDueDate)
      );
      
      setIsPurchaseDialogOpen(false);
      setPurchaseForm({
        cardId: '',
        description: '',
        totalAmount: '',
        totalInstallments: '1',
        firstDueDate: format(new Date(), 'yyyy-MM-dd')
      });
    } catch (error) {
      console.error('Error creating purchase:', error);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await payStatement(
        paymentForm.cardId,
        parseFloat(paymentForm.amount),
        paymentForm.bankAccountId
      );
      
      setIsPaymentDialogOpen(false);
      setPaymentForm({
        cardId: '',
        amount: '',
        bankAccountId: ''
      });
    } catch (error) {
      console.error('Error paying statement:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'credit',
      number: '',
      brand: 'visa',
      limit: '',
      closingDay: '5',
      dueDay: '15',
      color: '#3b82f6'
    });
  };

  const handleEdit = (card: any) => {
    setEditingCard(card);
    setFormData({
      name: card.name,
      type: card.type,
      number: card.number,
      brand: card.brand,
      limit: card.limit?.toString() || '',
      closingDay: card.closingDay.toString(),
      dueDay: card.dueDay.toString(),
      color: card.color
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cartão?')) {
      try {
        await deleteCard(id);
      } catch (error) {
        console.error('Error deleting card:', error);
      }
    }
  };

  const openPurchaseDialog = (card: any) => {
    setSelectedCard(card);
    setPurchaseForm({
      cardId: card.id,
      description: '',
      totalAmount: '',
      totalInstallments: '1',
      firstDueDate: format(new Date(), 'yyyy-MM-dd')
    });
    setIsPurchaseDialogOpen(true);
  };

  const openPaymentDialog = (card: any) => {
    setSelectedCard(card);
    setPaymentForm({
      cardId: card.id,
      amount: card.currentBalance.toString(),
      bankAccountId: accounts.length > 0 ? accounts[0].id : ''
    });
    setIsPaymentDialogOpen(true);
  };

  const formatCardNumber = (number: string) => {
    return number.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const maskCardNumber = (number: string) => {
    return '**** **** **** ' + number.slice(-4);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const CardItem = ({ card }: { card: any }) => {
    const usagePercent = card.limit ? (card.currentBalance / card.limit) * 100 : 0;
    const isShowing = showNumber[card.id];

    return (
      <div className="relative overflow-hidden rounded-2xl p-6" style={{ backgroundColor: card.color }}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-white/80 text-sm">{card.name}</p>
              <p className="text-white font-bold text-lg capitalize">{card.type === 'credit' ? 'Crédito' : 'Débito'}</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                onClick={() => setShowNumber(prev => ({ ...prev, [card.id]: !prev[card.id] }))}
              >
                {isShowing ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                onClick={() => handleEdit(card)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                onClick={() => handleDelete(card.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2">
              <p className="text-white text-xl tracking-wider font-mono">
                {isShowing ? formatCardNumber(card.number) : maskCardNumber(card.number)}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div>
              {card.type === 'credit' && (
                <>
                  <p className="text-white/60 text-xs">Limite disponível</p>
                  <p className="text-white font-semibold">{formatCurrency(card.availableLimit)}</p>
                </>
              )}
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs">
                {cardBrands.find(b => b.value === card.brand)?.label || card.brand}
              </p>
            </div>
          </div>

          {card.type === 'credit' && (
            <>
              <div className="mt-4">
                <Progress value={usagePercent} className="h-1 bg-white/20" />
                <p className="text-white/60 text-xs mt-1">
                  {formatCurrency(card.currentBalance)} de {formatCurrency(card.limit)} utilizado
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1 bg-white/20 text-white hover:bg-white/30"
                  onClick={() => openPurchaseDialog(card)}
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Compra
                </Button>
                {card.currentBalance > 0 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1 bg-white/20 text-white hover:bg-white/30"
                    onClick={() => openPaymentDialog(card)}
                  >
                    <Receipt className="w-4 h-4 mr-1" />
                    Pagar
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cartões</h1>
          <p className="text-slate-400">Gerencie seus cartões de crédito e débito</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
              setEditingCard(null);
              resetForm();
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cartão
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCard ? 'Editar' : 'Novo'} Cartão</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(v) => setFormData({...formData, type: v as 'credit' | 'debit'})}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="credit">Crédito</SelectItem>
                      <SelectItem value="debit">Débito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Bandeira</Label>
                  <Select value={formData.brand} onValueChange={(v: any) => setFormData({...formData, brand: v})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {cardBrands.map(b => (
                        <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nome do Cartão</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  placeholder="Ex: Nubank, Itaú..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Número do Cartão</Label>
                <Input
                  value={formData.number}
                  onChange={(e) => setFormData({...formData, number: e.target.value.replace(/\D/g, '').slice(0, 16)})}
                  className="bg-slate-800 border-slate-700 font-mono"
                  placeholder="0000 0000 0000 0000"
                  maxLength={16}
                  required
                />
              </div>

              {formData.type === 'credit' && (
                <div className="space-y-2">
                  <Label>Limite (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.limit}
                    onChange={(e) => setFormData({...formData, limit: e.target.value})}
                    className="bg-slate-800 border-slate-700"
                    placeholder="0,00"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Fechamento</Label>
                  <Select value={formData.closingDay} onValueChange={(v) => setFormData({...formData, closingDay: v})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 max-h-48">
                      {Array.from({ length: 31 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vencimento</Label>
                  <Select value={formData.dueDay} onValueChange={(v) => setFormData({...formData, dueDay: v})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 max-h-48">
                      {Array.from({ length: 31 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <Select value={formData.color} onValueChange={(v) => setFormData({...formData, color: v})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {cardColors.map(c => (
                        <SelectItem key={c.value} value={c.value}>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.value }}></div>
                            {c.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {editingCard ? 'Salvar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Limite Total</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(getTotalCreditLimit())}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Utilizado</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(getTotalCreditUsed())}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Cards and Installments */}
      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="bg-slate-800">
          <TabsTrigger value="cards">Cartões</TabsTrigger>
          <TabsTrigger value="installments">Parcelas</TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="space-y-6">
          {/* Credit Cards */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Cartões de Crédito</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {creditCards.length > 0 ? (
                creditCards.map(card => <CardItem key={card.id} card={card} />)
              ) : (
                <div className="col-span-2 text-center py-8 text-slate-500 bg-slate-800/50 rounded-2xl">
                  Nenhum cartão de crédito cadastrado
                </div>
              )}
            </div>
          </div>

          {/* Debit Cards */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Cartões de Débito</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {debitCards.length > 0 ? (
                debitCards.map(card => <CardItem key={card.id} card={card} />)
              ) : (
                <div className="col-span-2 text-center py-8 text-slate-500 bg-slate-800/50 rounded-2xl">
                  Nenhum cartão de débito cadastrado
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="installments">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Parcelas Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              {installments.length > 0 ? (
                <div className="space-y-3">
                  {installments.map((installment) => {
                    const card = cards.find(c => c.id === installment.cardId);
                    return (
                      <div key={installment.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{installment.description}</p>
                            <p className="text-sm text-slate-400">
                              {card?.name} • Parcela {installment.currentInstallment}/{installment.totalInstallments}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-white">{formatCurrency(installment.installmentAmount)}</p>
                          <p className="text-xs text-slate-500">
                            Venc: {format(new Date(installment.dueDate), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  Nenhuma parcela pendente
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Purchase Dialog */}
      <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Compra Parcelada</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePurchaseSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Cartão</Label>
              <Input
                value={selectedCard?.name || ''}
                disabled
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={purchaseForm.description}
                onChange={(e) => setPurchaseForm({...purchaseForm, description: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="Ex: TV LED 50 pol"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Total (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={purchaseForm.totalAmount}
                  onChange={(e) => setPurchaseForm({...purchaseForm, totalAmount: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  placeholder="0,00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Número de Parcelas</Label>
                <Select 
                  value={purchaseForm.totalInstallments} 
                  onValueChange={(v) => setPurchaseForm({...purchaseForm, totalInstallments: v})}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}x</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Primeiro Vencimento</Label>
              <Input
                type="date"
                value={purchaseForm.firstDueDate}
                onChange={(e) => setPurchaseForm({...purchaseForm, firstDueDate: e.target.value})}
                className="bg-slate-800 border-slate-700"
                required
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsPurchaseDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                Confirmar Compra
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Pagar Fatura</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Cartão</Label>
              <Input
                value={selectedCard?.name || ''}
                disabled
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Valor a Pagar (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="0,00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Conta para Débito</Label>
              <Select 
                value={paymentForm.bankAccountId} 
                onValueChange={(v) => setPaymentForm({...paymentForm, bankAccountId: v})}
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
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsPaymentDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                Confirmar Pagamento
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
