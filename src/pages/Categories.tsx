import { useState } from 'react';
import { Plus, Edit2, Trash2, Tag, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';

const colors = [
  { value: '#22c55e', label: 'Verde' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#f97316', label: 'Laranja' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#14b8a6', label: 'Turquesa' },
  { value: '#06b6d4', label: 'Ciano' },
  { value: '#eab308', label: 'Amarelo' },
  { value: '#64748b', label: 'Cinza' }
];

export function Categories() {
  const { user } = useAuth();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories(user?.id);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('expense');

  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    color: '#3b82f6',
    icon: 'more-horizontal',
    budget: ''
  });

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      userId: user!.id,
      name: formData.name,
      type: formData.type,
      color: formData.color,
      icon: formData.icon,
      budget: formData.budget ? parseFloat(formData.budget) : undefined
    };

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
      } else {
        await addCategory(data);
      }
      
      setIsDialogOpen(false);
      setEditingCategory(null);
      resetForm();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: activeTab as 'income' | 'expense',
      color: '#3b82f6',
      icon: 'more-horizontal',
      budget: ''
    });
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon,
      budget: category.budget?.toString() || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await deleteCategory(id);
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const CategoryCard = ({ category }: { category: any }) => (
    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${category.color}20` }}
        >
          <Tag className="w-5 h-5" style={{ color: category.color }} />
        </div>
        <div>
          <p className="text-white font-medium">{category.name}</p>
          {category.budget && (
            <p className="text-xs text-slate-400">Orçamento: R$ {category.budget.toFixed(2)}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(category)}>
          <Edit2 className="w-4 h-4 text-slate-400" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(category.id)}>
          <Trash2 className="w-4 h-4 text-red-400" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Categorias</h1>
          <p className="text-slate-400">Organize suas receitas e despesas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
              setEditingCategory(null);
              resetForm();
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Editar' : 'Nova'} Categoria</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  placeholder="Nome da categoria"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as 'income' | 'expense'})}
                    className="w-full h-10 px-3 rounded-md bg-slate-800 border border-slate-700 text-white"
                  >
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Orçamento (opcional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    className="bg-slate-800 border-slate-700"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {colors.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFormData({...formData, color: c.value})}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === c.value ? 'border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {editingCategory ? 'Salvar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-800">
          <TabsTrigger value="expense" className="data-[state=active]:bg-slate-700">
            <TrendingDown className="w-4 h-4 mr-2" />
            Despesas
          </TabsTrigger>
          <TabsTrigger value="income" className="data-[state=active]:bg-slate-700">
            <TrendingUp className="w-4 h-4 mr-2" />
            Receitas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expense" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Categorias de Despesa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expenseCategories.length > 0 ? (
                  expenseCategories.map(c => <CategoryCard key={c.id} category={c} />)
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    Nenhuma categoria de despesa
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Categorias de Receita</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {incomeCategories.length > 0 ? (
                  incomeCategories.map(c => <CategoryCard key={c.id} category={c} />)
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    Nenhuma categoria de receita
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
