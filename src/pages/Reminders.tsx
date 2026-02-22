import { useState, useMemo } from 'react';
import { Plus, Check, Calendar, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useReminders } from '@/hooks/useReminders';
import { useCategories } from '@/hooks/useCategories';
import { format, isPast, isToday } from 'date-fns';

export function Reminders() {
  const { user } = useAuth();
  const { reminders, addReminder, updateReminder, deleteReminder, completeReminder, getUpcoming, getOverdue } = useReminders(user?.id);
  const { categories } = useCategories(user?.id);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    category: '',
    isRecurring: false,
    recurringPeriod: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    notificationEnabled: true
  });

  const upcoming = useMemo(() => getUpcoming(30), [getUpcoming]);
  const overdue = useMemo(() => getOverdue(), [getOverdue]);
  const completed = useMemo(() => reminders.filter(r => r.isCompleted), [reminders]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      userId: user!.id,
      title: formData.title,
      description: formData.description,
      amount: parseFloat(formData.amount),
      dueDate: new Date(formData.dueDate),
      category: formData.category,
      isRecurring: formData.isRecurring,
      recurringPeriod: formData.isRecurring ? formData.recurringPeriod : undefined,
      isCompleted: false,
      notificationEnabled: formData.notificationEnabled
    };

    try {
      if (editingReminder) {
        await updateReminder(editingReminder.id, data);
      } else {
        await addReminder(data);
      }
      
      setIsDialogOpen(false);
      setEditingReminder(null);
      resetForm();
    } catch (error) {
      console.error('Error saving reminder:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      amount: '',
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      category: '',
      isRecurring: false,
      recurringPeriod: 'monthly',
      notificationEnabled: true
    });
  };

  const handleEdit = (reminder: any) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      description: reminder.description || '',
      amount: reminder.amount.toString(),
      dueDate: format(new Date(reminder.dueDate), 'yyyy-MM-dd'),
      category: reminder.category,
      isRecurring: reminder.isRecurring,
      recurringPeriod: reminder.recurringPeriod || 'monthly',
      notificationEnabled: reminder.notificationEnabled
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este lembrete?')) {
      try {
        await deleteReminder(id);
      } catch (error) {
        console.error('Error deleting reminder:', error);
      }
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeReminder(id);
    } catch (error) {
      console.error('Error completing reminder:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getDueStatus = (dueDate: Date) => {
    if (isToday(dueDate)) return { text: 'Hoje', color: 'text-yellow-500' };
    if (isPast(dueDate)) return { text: 'Atrasado', color: 'text-red-500' };
    const days = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return { text: `Em ${days} dias`, color: 'text-green-500' };
  };

  const ReminderCard = ({ reminder, showComplete = true }: { reminder: any; showComplete?: boolean }) => {
    const status = getDueStatus(new Date(reminder.dueDate));
    
    return (
      <div className={`flex items-center justify-between p-4 rounded-lg ${
        reminder.isCompleted ? 'bg-slate-800/30' : 'bg-slate-800/50'
      }`}>
        <div className="flex items-center gap-4">
          {showComplete && (
            <button
              onClick={() => handleComplete(reminder.id)}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                reminder.isCompleted 
                  ? 'bg-green-500 border-green-500' 
                  : 'border-slate-500 hover:border-green-500'
              }`}
            >
              {reminder.isCompleted && <Check className="w-4 h-4 text-white" />}
            </button>
          )}
          <div>
            <p className={`font-medium ${reminder.isCompleted ? 'text-slate-500 line-through' : 'text-white'}`}>
              {reminder.title}
            </p>
            {reminder.description && (
              <p className="text-sm text-slate-400">{reminder.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-slate-400">{reminder.category}</span>
              <span className="text-slate-600">•</span>
              <span className={`text-sm ${status.color}`}>{status.text}</span>
              {reminder.isRecurring && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-sm text-blue-400">Recorrente</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className={`font-medium ${reminder.isCompleted ? 'text-slate-500' : 'text-white'}`}>
              {formatCurrency(reminder.amount)}
            </p>
            <p className="text-xs text-slate-500">
              {format(new Date(reminder.dueDate), 'dd/MM/yyyy')}
            </p>
          </div>
          {!reminder.isCompleted && (
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(reminder)}>
                <Edit2 className="w-4 h-4 text-slate-400" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(reminder.id)}>
                <Trash2 className="w-4 h-4 text-red-400" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Lembretes</h1>
          <p className="text-slate-400">Não esqueça de pagar suas contas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
              setEditingReminder(null);
              resetForm();
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Lembrete
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingReminder ? 'Editar' : 'Novo'} Lembrete</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  placeholder="Ex: Aluguel, Internet..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  placeholder="Detalhes adicionais"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="bg-slate-800 border-slate-700"
                    placeholder="0,00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vencimento</Label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    className="bg-slate-800 border-slate-700"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {categories.filter(c => c.type === 'expense').map(c => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isRecurring}
                    onCheckedChange={(v) => setFormData({...formData, isRecurring: v})}
                  />
                  <Label>Recorrente</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.notificationEnabled}
                    onCheckedChange={(v) => setFormData({...formData, notificationEnabled: v})}
                  />
                  <Label>Notificar</Label>
                </div>
              </div>

              {formData.isRecurring && (
                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select 
                    value={formData.recurringPeriod} 
                    onValueChange={(v: any) => setFormData({...formData, recurringPeriod: v})}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {editingReminder ? 'Salvar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts */}
      {overdue.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-400">
            Você tem {overdue.length} lembrete{overdue.length > 1 ? 's' : ''} atrasado{overdue.length > 1 ? 's' : ''}
          </p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-800">
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-slate-700">
            <Calendar className="w-4 h-4 mr-2" />
            Próximos
          </TabsTrigger>
          <TabsTrigger value="overdue" className="data-[state=active]:bg-slate-700">
            <AlertCircle className="w-4 h-4 mr-2" />
            Atrasados
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-slate-700">
            <Check className="w-4 h-4 mr-2" />
            Concluídos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Próximos Vencimentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcoming.length > 0 ? (
                  upcoming.map(r => <ReminderCard key={r.id} reminder={r} />)
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    Nenhum lembrete próximo
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Lembretes Atrasados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overdue.length > 0 ? (
                  overdue.map(r => <ReminderCard key={r.id} reminder={r} />)
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    Nenhum lembrete atrasado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Lembretes Concluídos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completed.length > 0 ? (
                  completed.map(r => <ReminderCard key={r.id} reminder={r} showComplete={false} />)
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    Nenhum lembrete concluído
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
