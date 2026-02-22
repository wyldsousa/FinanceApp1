import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Lightbulb, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useInvestments } from '@/hooks/useInvestments';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'tip' | 'warning' | 'analysis' | 'goal';
}

export function Assistant() {
  const { user } = useAuth();
  const { transactions } = useTransactions(user?.id);
  const { getSummary } = useInvestments(user?.id);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial greeting with insights
    generateInitialInsights();
  }, [transactions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const generateInitialInsights = () => {
    const insights: Message[] = [];
    
    // Monthly analysis
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

    const balance = income - expense;

    // Add greeting
    insights.push({
      id: 'greeting',
      role: 'assistant',
      content: `Olá, ${user?.name?.split(' ')[0] || 'usuário'}! Sou seu assistente financeiro. Aqui está uma análise do seu mês:`,
      type: 'tip'
    });

    // Balance insight
    if (balance > 0) {
      insights.push({
        id: 'balance',
        role: 'assistant',
        content: `✅ Você está com saldo positivo de ${formatCurrency(balance)} este mês. Continue assim!`,
        type: 'analysis'
      });
    } else if (balance < 0) {
      insights.push({
        id: 'balance',
        role: 'assistant',
        content: `⚠️ Atenção: seu saldo está negativo em ${formatCurrency(Math.abs(balance))} este mês. Tente reduzir despesas não essenciais.`,
        type: 'warning'
      });
    }

    // Expense analysis
    if (expense > income * 0.8) {
      insights.push({
        id: 'expense',
        role: 'assistant',
        content: `💡 Dica: Suas despesas representam ${((expense / income) * 100).toFixed(0)}% da sua renda. O ideal é manter abaixo de 80%.`,
        type: 'tip'
      });
    }

    // Investment insight
    const invSummary = getSummary();
    if (invSummary.totalInvested > 0) {
      const profitPercent = invSummary.profitLossPercentage;
      insights.push({
        id: 'investment',
        role: 'assistant',
        content: `📈 Seus investimentos estão com ${profitPercent >= 0 ? 'rentabilidade positiva' : 'rentabilidade negativa'} de ${profitPercent.toFixed(2)}%.`,
        type: 'analysis'
      });
    }

    // Savings goal
    if (income > 0) {
      const savingsRate = (balance / income) * 100;
      if (savingsRate < 20) {
        insights.push({
          id: 'savings',
          role: 'assistant',
          content: `🎯 Meta: Tente economizar pelo menos 20% da sua renda. Atualmente você está economizando ${savingsRate.toFixed(1)}%.`,
          type: 'goal'
        });
      }
    }

    setMessages(insights);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const response = generateResponse(input);
      setMessages(prev => [...prev, response]);
      setLoading(false);
    }, 1000);
  };

  const generateResponse = (query: string): Message => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('gasto') || lowerQuery.includes('despesa')) {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      
      const monthExpenses = transactions.filter(t => 
        t.type === 'expense' && 
        isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
      );

      const totalExpense = monthExpenses.reduce((sum, t) => sum + t.amount, 0);
      
      // Get top expense category
      const byCategory = monthExpenses.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

      const topCategory = Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])[0];

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Este mês você gastou ${formatCurrency(totalExpense)}. ${topCategory ? `Sua maior despesa foi com ${topCategory[0]} (${formatCurrency(topCategory[1])}).` : ''}`,
        type: 'analysis'
      };
    }

    if (lowerQuery.includes('investimento') || lowerQuery.includes('rendimento')) {
      const summary = getSummary();
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Você tem ${formatCurrency(summary.totalInvested)} investidos com valor atual de ${formatCurrency(summary.currentValue)}. ${summary.profitLoss >= 0 ? 'Lucro' : 'Prejuízo'} de ${formatCurrency(Math.abs(summary.profitLoss))} (${summary.profitLossPercentage.toFixed(2)}%).`,
        type: 'analysis'
      };
    }

    if (lowerQuery.includes('economia') || lowerQuery.includes('poupar')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Para economizar mais, tente: 1) Criar um orçamento mensal, 2) Reduzir gastos supérfluos, 3) Automatizar transferências para poupança no dia do pagamento, 4) Comparar preços antes de comprar.',
        type: 'tip'
      };
    }

    if (lowerQuery.includes('dica') || lowerQuery.includes('sugestão')) {
      const tips = [
        'Regra 50-30-20: 50% para necessidades, 30% para desejos, 20% para economias.',
        'Tenha uma reserva de emergência equivalente a 6 meses de despesas.',
        'Diversifique seus investimentos para reduzir riscos.',
        'Revise suas assinaturas mensais e cancele as que não usa.',
        'Use o cartão de crédito com responsabilidade e pague a fatura integral.'
      ];
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: tips[Math.floor(Math.random() * tips.length)],
        type: 'tip'
      };
    }

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Posso ajudar com informações sobre seus gastos, investimentos, e dar dicas de economia. O que gostaria de saber?',
      type: 'tip'
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case 'tip': return <Lightbulb className="w-5 h-5 text-yellow-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'analysis': return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'goal': return <Target className="w-5 h-5 text-green-500" />;
      default: return <Sparkles className="w-5 h-5 text-purple-500" />;
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-120px)]">
      <div>
        <h1 className="text-2xl font-bold text-white">Assistente IA</h1>
        <p className="text-slate-400">Seu consultor financeiro pessoal</p>
      </div>

      <Card className="bg-slate-900 border-slate-800 flex flex-col h-full">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-white'
                  }`}
                >
                  {message.role === 'assistant' && message.type && (
                    <div className="flex items-center gap-2 mb-2">
                      {getMessageIcon(message.type)}
                      <span className="text-xs text-slate-400 capitalize">{message.type}</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-slate-800 p-4 rounded-2xl">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <CardContent className="p-4 border-t border-slate-800">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Pergunte sobre suas finanças..."
              className="bg-slate-800 border-slate-700 text-white"
            />
            <Button 
              onClick={handleSend} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loading || !input.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setInput('Quanto gastei este mês?')}>
              Quanto gastei?
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setInput('Como estão meus investimentos?')}>
              Meus investimentos
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setInput('Dicas para economizar')}>
              Dicas de economia
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
