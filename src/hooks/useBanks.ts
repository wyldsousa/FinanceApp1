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
import type { BankAccount } from '@/types';

export function useBanks(userId: string | undefined) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const q = query(
      collection(db, 'bankAccounts'),
      where('userId', '==', userId),
      where('isActive', '==', true),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            ...d,
            createdAt: d.createdAt?.toDate() || new Date(),
            updatedAt: d.updatedAt?.toDate() || new Date()
          } as BankAccount;
        });
        setAccounts(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching bank accounts:', err);
        setError('Erro ao carregar contas bancárias');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const addAccount = useCallback(async (account: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'bankAccounts'), {
        ...account,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar conta');
      throw err;
    }
  }, []);

  const updateAccount = useCallback(async (id: string, data: Partial<BankAccount>) => {
    try {
      await updateDoc(doc(db, 'bankAccounts', id), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar conta');
      throw err;
    }
  }, []);

  const deleteAccount = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, 'bankAccounts', id), {
        isActive: false,
        updatedAt: serverTimestamp()
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir conta');
      throw err;
    }
  }, []);

  const updateBalance = useCallback(async (accountId: string, amount: number) => {
    try {
      const accountRef = doc(db, 'bankAccounts', accountId);
      
      await runTransaction(db, async (transaction) => {
        const accountDoc = await transaction.get(accountRef);
        if (!accountDoc.exists()) {
          throw new Error('Conta não encontrada');
        }
        
        const currentBalance = accountDoc.data().balance || 0;
        const newBalance = currentBalance + amount;
        
        transaction.update(accountRef, {
          balance: newBalance,
          updatedAt: serverTimestamp()
        });
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar saldo');
      throw err;
    }
  }, []);

  const getTotalBalance = useCallback(() => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0);
  }, [accounts]);

  return {
    accounts,
    loading,
    error,
    addAccount,
    updateAccount,
    deleteAccount,
    updateBalance,
    getTotalBalance
  };
}
