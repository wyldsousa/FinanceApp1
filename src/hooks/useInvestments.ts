import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Investment, InvestmentTransaction } from '@/types';

export function useInvestments(userId: string | undefined) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch investments
  useEffect(() => {
    if (!userId) {
      setInvestments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const q = query(
      collection(db, 'investments'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            ...d,
            purchaseDate: d.purchaseDate?.toDate() || new Date(),
            createdAt: d.createdAt?.toDate() || new Date(),
            updatedAt: d.updatedAt?.toDate() || new Date()
          } as Investment;
        });
        setInvestments(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching investments:', err);
        setError('Erro ao carregar investimentos');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Fetch investment transactions
  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      return;
    }

    const q = query(
      collection(db, 'investmentTransactions'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            ...d,
            date: d.date?.toDate() || new Date(),
            createdAt: d.createdAt?.toDate() || new Date(),
            updatedAt: d.updatedAt?.toDate() || new Date()
          } as InvestmentTransaction;
        });
        setTransactions(data);
      },
      (err) => {
        console.error('Error fetching investment transactions:', err);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const addInvestment = useCallback(async (investment: Omit<Investment, 'id' | 'createdAt' | 'updatedAt' | 'totalInvested' | 'currentValue'>) => {
    try {
      const totalInvested = investment.quantity * investment.averagePrice;
      const currentValue = investment.quantity * investment.currentPrice;
      
      const docRef = await addDoc(collection(db, 'investments'), {
        ...investment,
        totalInvested,
        currentValue,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Record the deposit transaction
      await addDoc(collection(db, 'investmentTransactions'), {
        userId: investment.userId,
        investmentId: docRef.id,
        bankAccountId: investment.bankAccountId,
        type: 'deposit',
        amount: totalInvested,
        date: new Date(),
        notes: 'Aporte inicial',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Deduct from bank account
      await runTransaction(db, async (t) => {
        const bankRef = doc(db, 'bankAccounts', investment.bankAccountId);
        const bankDoc = await t.get(bankRef);
        
        if (bankDoc.exists()) {
          const currentBalance = bankDoc.data().balance || 0;
          t.update(bankRef, {
            balance: currentBalance - totalInvested,
            updatedAt: serverTimestamp()
          });
        }
      });

      return docRef.id;
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar investimento');
      throw err;
    }
  }, []);

  const updateInvestment = useCallback(async (id: string, data: Partial<Investment>) => {
    try {
      const updateData: any = { ...data, updatedAt: serverTimestamp() };
      
      // Recalculate totals if price or quantity changed
      if (data.quantity || data.averagePrice || data.currentPrice) {
        const inv = investments.find(i => i.id === id);
        if (inv) {
          const quantity = data.quantity ?? inv.quantity;
          const avgPrice = data.averagePrice ?? inv.averagePrice;
          const currPrice = data.currentPrice ?? inv.currentPrice;
          
          updateData.totalInvested = quantity * avgPrice;
          updateData.currentValue = quantity * currPrice;
        }
      }
      
      await updateDoc(doc(db, 'investments', id), updateData);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar investimento');
      throw err;
    }
  }, [investments]);

  const deleteInvestment = useCallback(async (investment: Investment, bankAccountId: string) => {
    try {
      await runTransaction(db, async (t) => {
        // Return money to bank account
        const bankRef = doc(db, 'bankAccounts', bankAccountId);
        const bankDoc = await t.get(bankRef);
        
        if (bankDoc.exists()) {
          const currentBalance = bankDoc.data().balance || 0;
          t.update(bankRef, {
            balance: currentBalance + investment.currentValue,
            updatedAt: serverTimestamp()
          });
        }

        // Record withdrawal
        const withdrawalRef = doc(collection(db, 'investmentTransactions'));
        t.set(withdrawalRef, {
          userId: investment.userId,
          investmentId: investment.id,
          bankAccountId,
          type: 'withdrawal',
          amount: investment.currentValue,
          date: new Date(),
          notes: 'Resgate total',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Delete investment
        t.delete(doc(db, 'investments', investment.id));
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir investimento');
      throw err;
    }
  }, []);

  // Deposit to investment
  const depositToInvestment = useCallback(async (
    investmentId: string,
    amount: number,
    bankAccountId: string
  ) => {
    try {
      await runTransaction(db, async (t) => {
        // Get investment
        const invRef = doc(db, 'investments', investmentId);
        const invDoc = await t.get(invRef);
        
        if (!invDoc.exists()) {
          throw new Error('Investimento não encontrado');
        }

        const invData = invDoc.data();
        const newTotalInvested = (invData.totalInvested || 0) + amount;
        const newCurrentValue = (invData.currentValue || 0) + amount;

        // Update investment
        t.update(invRef, {
          totalInvested: newTotalInvested,
          currentValue: newCurrentValue,
          updatedAt: serverTimestamp()
        });

        // Deduct from bank account
        const bankRef = doc(db, 'bankAccounts', bankAccountId);
        const bankDoc = await t.get(bankRef);
        
        if (bankDoc.exists()) {
          const currentBalance = bankDoc.data().balance || 0;
          t.update(bankRef, {
            balance: currentBalance - amount,
            updatedAt: serverTimestamp()
          });
        }

        // Record transaction
        const transRef = doc(collection(db, 'investmentTransactions'));
        t.set(transRef, {
          userId: invData.userId,
          investmentId,
          bankAccountId,
          type: 'deposit',
          amount,
          date: new Date(),
          notes: 'Novo aporte',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar aporte');
      throw err;
    }
  }, []);

  // Withdraw from investment
  const withdrawFromInvestment = useCallback(async (
    investmentId: string,
    amount: number,
    bankAccountId: string
  ) => {
    try {
      await runTransaction(db, async (t) => {
        // Get investment
        const invRef = doc(db, 'investments', investmentId);
        const invDoc = await t.get(invRef);
        
        if (!invDoc.exists()) {
          throw new Error('Investimento não encontrado');
        }

        const invData = invDoc.data();
        const currentValue = invData.currentValue || 0;

        if (amount > currentValue) {
          throw new Error('Valor de resgate maior que o valor atual');
        }

        const newCurrentValue = currentValue - amount;

        // Update investment
        t.update(invRef, {
          currentValue: newCurrentValue,
          updatedAt: serverTimestamp()
        });

        // Add to bank account
        const bankRef = doc(db, 'bankAccounts', bankAccountId);
        const bankDoc = await t.get(bankRef);
        
        if (bankDoc.exists()) {
          const currentBalance = bankDoc.data().balance || 0;
          t.update(bankRef, {
            balance: currentBalance + amount,
            updatedAt: serverTimestamp()
          });
        }

        // Record transaction
        const transRef = doc(collection(db, 'investmentTransactions'));
        t.set(transRef, {
          userId: invData.userId,
          investmentId,
          bankAccountId,
          type: 'withdrawal',
          amount,
          date: new Date(),
          notes: 'Resgate parcial',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar resgate');
      throw err;
    }
  }, []);

  const getSummary = useCallback(() => {
    const totalInvested = investments.reduce((sum, i) => sum + i.totalInvested, 0);
    const currentValue = investments.reduce((sum, i) => sum + i.currentValue, 0);
    const profitLoss = currentValue - totalInvested;
    const profitLossPercentage = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

    return {
      totalInvested,
      currentValue,
      profitLoss,
      profitLossPercentage
    };
  }, [investments]);

  const getByType = useCallback(() => {
    const typeMap = new Map<string, { totalInvested: number; currentValue: number; count: number }>();
    
    investments.forEach(i => {
      const current = typeMap.get(i.type) || { totalInvested: 0, currentValue: 0, count: 0 };
      typeMap.set(i.type, {
        totalInvested: current.totalInvested + i.totalInvested,
        currentValue: current.currentValue + i.currentValue,
        count: current.count + 1
      });
    });

    return Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      ...data,
      profitLoss: data.currentValue - data.totalInvested
    }));
  }, [investments]);

  const getInvestmentTransactions = useCallback((investmentId: string) => {
    return transactions.filter(t => t.investmentId === investmentId);
  }, [transactions]);

  return {
    investments,
    transactions,
    loading,
    error,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    depositToInvestment,
    withdrawFromInvestment,
    getSummary,
    getByType,
    getInvestmentTransactions
  };
}
