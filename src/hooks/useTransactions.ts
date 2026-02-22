import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Transaction } from '@/types';

export function useTransactions(userId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const q = query(
      collection(db, 'transactions'),
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
          } as Transaction;
        });
        setTransactions(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching transactions:', err);
        setError('Erro ao carregar transações');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Start a transaction to ensure atomicity
      const result = await runTransaction(db, async (t) => {
        // Add the transaction
        const transactionRef = doc(collection(db, 'transactions'));
        t.set(transactionRef, {
          ...transaction,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Update bank account balance
        const bankAccountRef = doc(db, 'bankAccounts', transaction.bankAccountId);
        const bankAccountDoc = await t.get(bankAccountRef);
        
        if (bankAccountDoc.exists()) {
          const currentBalance = bankAccountDoc.data().balance || 0;
          const amountChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
          
          t.update(bankAccountRef, {
            balance: currentBalance + amountChange,
            updatedAt: serverTimestamp()
          });
        }

        return transactionRef.id;
      });

      return result;
    } catch (err: any) {
      console.error('Error adding transaction:', err);
      setError(err.message || 'Erro ao adicionar transação');
      throw err;
    }
  }, []);

  const updateTransaction = useCallback(async (id: string, data: Partial<Transaction>, originalTransaction?: Transaction) => {
    try {
      await runTransaction(db, async (t) => {
        const transactionRef = doc(db, 'transactions', id);
        const transactionDoc = await t.get(transactionRef);
        
        if (!transactionDoc.exists()) {
          throw new Error('Transação não encontrada');
        }

        // If bank account or amount changed, update balances
        if (originalTransaction && (
          data.bankAccountId !== originalTransaction.bankAccountId ||
          data.amount !== originalTransaction.amount ||
          data.type !== originalTransaction.type
        )) {
          // Revert old bank account balance
          const oldBankRef = doc(db, 'bankAccounts', originalTransaction.bankAccountId);
          const oldBankDoc = await t.get(oldBankRef);
          if (oldBankDoc.exists()) {
            const oldBalance = oldBankDoc.data().balance || 0;
            const oldAmountChange = originalTransaction.type === 'income' 
              ? -originalTransaction.amount 
              : originalTransaction.amount;
            
            t.update(oldBankRef, {
              balance: oldBalance + oldAmountChange,
              updatedAt: serverTimestamp()
            });
          }

          // Apply to new bank account balance
          const newBankId = data.bankAccountId || originalTransaction.bankAccountId;
          const newBankRef = doc(db, 'bankAccounts', newBankId);
          const newBankDoc = await t.get(newBankRef);
          if (newBankDoc.exists()) {
            const newBalance = newBankDoc.data().balance || 0;
            const newType = data.type || originalTransaction.type;
            const newAmount = data.amount || originalTransaction.amount;
            const newAmountChange = newType === 'income' ? newAmount : -newAmount;
            
            t.update(newBankRef, {
              balance: newBalance + newAmountChange,
              updatedAt: serverTimestamp()
            });
          }
        }

        // Update transaction
        t.update(transactionRef, {
          ...data,
          updatedAt: serverTimestamp()
        });
      });
    } catch (err: any) {
      console.error('Error updating transaction:', err);
      setError(err.message || 'Erro ao atualizar transação');
      throw err;
    }
  }, []);

  const deleteTransaction = useCallback(async (transaction: Transaction) => {
    try {
      await runTransaction(db, async (t) => {
        // Revert bank account balance
        const bankAccountRef = doc(db, 'bankAccounts', transaction.bankAccountId);
        const bankAccountDoc = await t.get(bankAccountRef);
        
        if (bankAccountDoc.exists()) {
          const currentBalance = bankAccountDoc.data().balance || 0;
          const amountChange = transaction.type === 'income' 
            ? -transaction.amount 
            : transaction.amount;
          
          t.update(bankAccountRef, {
            balance: currentBalance + amountChange,
            updatedAt: serverTimestamp()
          });
        }

        // Delete transaction
        t.delete(doc(db, 'transactions', transaction.id));
      });
    } catch (err: any) {
      console.error('Error deleting transaction:', err);
      setError(err.message || 'Erro ao excluir transação');
      throw err;
    }
  }, []);

  const getMonthlySummary = useCallback((month: number, year: number) => {
    const monthlyTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === month && date.getFullYear() === year;
    });

    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return { income, expense, balance: income - expense };
  }, [transactions]);

  const getTransactionsByCategory = useCallback((type: 'income' | 'expense') => {
    const categoryMap = new Map<string, number>();
    
    transactions
      .filter(t => t.type === type)
      .forEach(t => {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + t.amount);
      });

    return Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount
    }));
  }, [transactions]);

  return {
    transactions,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getMonthlySummary,
    getTransactionsByCategory
  };
}
