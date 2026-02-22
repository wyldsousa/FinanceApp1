import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  runTransaction,
  getDocs
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Card, CardInstallment, CardStatement } from '@/types';

export function useCards(userId: string | undefined) {
  const [cards, setCards] = useState<Card[]>([]);
  const [installments, setInstallments] = useState<CardInstallment[]>([]);
  const [statements, setStatements] = useState<CardStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch cards
  useEffect(() => {
    if (!userId) {
      setCards([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const q = query(
      collection(db, 'cards'),
      where('userId', '==', userId),
      where('isActive', '==', true)
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
          } as Card;
        });
        setCards(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching cards:', err);
        setError('Erro ao carregar cartões');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Fetch installments
  useEffect(() => {
    if (!userId) {
      setInstallments([]);
      return;
    }

    const q = query(
      collection(db, 'cardInstallments'),
      where('userId', '==', userId),
      where('isPaid', '==', false)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            ...d,
            dueDate: d.dueDate?.toDate() || new Date(),
            createdAt: d.createdAt?.toDate() || new Date(),
            updatedAt: d.updatedAt?.toDate() || new Date()
          } as CardInstallment;
        });
        setInstallments(data);
      },
      (err) => {
        console.error('Error fetching installments:', err);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Fetch statements
  useEffect(() => {
    if (!userId) {
      setStatements([]);
      return;
    }

    const q = query(
      collection(db, 'cardStatements'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            ...d,
            dueDate: d.dueDate?.toDate() || new Date(),
            createdAt: d.createdAt?.toDate() || new Date(),
            updatedAt: d.updatedAt?.toDate() || new Date()
          } as CardStatement;
        });
        setStatements(data);
      },
      (err) => {
        console.error('Error fetching statements:', err);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const addCard = useCallback(async (card: Omit<Card, 'id' | 'createdAt' | 'updatedAt' | 'availableLimit'>) => {
    try {
      const docRef = await addDoc(collection(db, 'cards'), {
        ...card,
        availableLimit: card.limit,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar cartão');
      throw err;
    }
  }, []);

  const updateCard = useCallback(async (id: string, data: Partial<Card>) => {
    try {
      await updateDoc(doc(db, 'cards', id), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar cartão');
      throw err;
    }
  }, []);

  const deleteCard = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, 'cards', id), {
        isActive: false,
        updatedAt: serverTimestamp()
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir cartão');
      throw err;
    }
  }, []);

  // Create installment purchase
  const createInstallmentPurchase = useCallback(async (
    cardId: string,
    description: string,
    totalAmount: number,
    totalInstallments: number,
    firstDueDate: Date
  ) => {
    try {
      const installmentAmount = totalAmount / totalInstallments;
      const transactionId = crypto.randomUUID();

      // Create installments
      for (let i = 0; i < totalInstallments; i++) {
        const dueDate = new Date(firstDueDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        await addDoc(collection(db, 'cardInstallments'), {
          userId,
          cardId,
          transactionId,
          description,
          totalAmount,
          installmentAmount,
          totalInstallments,
          currentInstallment: i + 1,
          dueDate,
          isPaid: false,
          paidAmount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      // Update card balance
      await runTransaction(db, async (t) => {
        const cardRef = doc(db, 'cards', cardId);
        const cardDoc = await t.get(cardRef);
        
        if (cardDoc.exists()) {
          const cardData = cardDoc.data();
          t.update(cardRef, {
            currentBalance: (cardData.currentBalance || 0) + totalAmount,
            availableLimit: (cardData.availableLimit || cardData.limit) - totalAmount,
            updatedAt: serverTimestamp()
          });
        }
      });

      return transactionId;
    } catch (err: any) {
      setError(err.message || 'Erro ao criar parcelamento');
      throw err;
    }
  }, [userId]);

  // Pay statement
  const payStatement = useCallback(async (
    cardId: string,
    amount: number,
    bankAccountId: string
  ) => {
    try {
      await runTransaction(db, async (t) => {
        // Get card
        const cardRef = doc(db, 'cards', cardId);
        const cardDoc = await t.get(cardRef);
        
        if (!cardDoc.exists()) {
          throw new Error('Cartão não encontrado');
        }

        const cardData = cardDoc.data();
        const currentBalance = cardData.currentBalance || 0;
        const availableLimit = cardData.availableLimit || cardData.limit;

        // Update card
        t.update(cardRef, {
          currentBalance: Math.max(0, currentBalance - amount),
          availableLimit: Math.min(cardData.limit, availableLimit + amount),
          updatedAt: serverTimestamp()
        });

        // Update bank account
        const bankRef = doc(db, 'bankAccounts', bankAccountId);
        const bankDoc = await t.get(bankRef);
        
        if (bankDoc.exists()) {
          const bankBalance = bankDoc.data().balance || 0;
          t.update(bankRef, {
            balance: bankBalance - amount,
            updatedAt: serverTimestamp()
          });
        }

        // Mark installments as paid
        const installmentsQuery = query(
          collection(db, 'cardInstallments'),
          where('cardId', '==', cardId),
          where('isPaid', '==', false)
        );
        
        const installmentsSnapshot = await getDocs(installmentsQuery);
        let remainingAmount = amount;

        for (const installmentDoc of installmentsSnapshot.docs) {
          if (remainingAmount <= 0) break;
          
          const installmentData = installmentDoc.data();
          const installmentAmount = installmentData.installmentAmount;
          
          if (remainingAmount >= installmentAmount) {
            t.update(installmentDoc.ref, {
              isPaid: true,
              paidAmount: installmentAmount,
              updatedAt: serverTimestamp()
            });
            remainingAmount -= installmentAmount;
          }
        }
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao pagar fatura');
      throw err;
    }
  }, []);

  // Anticipate installment
  const anticipateInstallment = useCallback(async (
    installmentId: string,
    bankAccountId: string
  ) => {
    try {
      await runTransaction(db, async (t) => {
        const installmentRef = doc(db, 'cardInstallments', installmentId);
        const installmentDoc = await t.get(installmentRef);
        
        if (!installmentDoc.exists()) {
          throw new Error('Parcela não encontrada');
        }

        const installmentData = installmentDoc.data();
        const amount = installmentData.installmentAmount;

        // Update installment
        t.update(installmentRef, {
          isPaid: true,
          paidAmount: amount,
          updatedAt: serverTimestamp()
        });

        // Update card
        const cardRef = doc(db, 'cards', installmentData.cardId);
        const cardDoc = await t.get(cardRef);
        
        if (cardDoc.exists()) {
          const cardData = cardDoc.data();
          t.update(cardRef, {
            currentBalance: (cardData.currentBalance || 0) - amount,
            availableLimit: (cardData.availableLimit || cardData.limit) + amount,
            updatedAt: serverTimestamp()
          });
        }

        // Update bank account
        const bankRef = doc(db, 'bankAccounts', bankAccountId);
        const bankDoc = await t.get(bankRef);
        
        if (bankDoc.exists()) {
          const bankBalance = bankDoc.data().balance || 0;
          t.update(bankRef, {
            balance: bankBalance - amount,
            updatedAt: serverTimestamp()
          });
        }
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao antecipar parcela');
      throw err;
    }
  }, []);

  const getCardInstallments = useCallback((cardId: string) => {
    return installments.filter(i => i.cardId === cardId);
  }, [installments]);

  const getTotalCreditLimit = useCallback(() => {
    return cards
      .filter(c => c.type === 'credit' && c.isActive)
      .reduce((sum, c) => sum + c.limit, 0);
  }, [cards]);

  const getTotalCreditUsed = useCallback(() => {
    return cards
      .filter(c => c.type === 'credit' && c.isActive)
      .reduce((sum, c) => sum + c.currentBalance, 0);
  }, [cards]);

  const getTotalAvailableLimit = useCallback(() => {
    return cards
      .filter(c => c.type === 'credit' && c.isActive)
      .reduce((sum, c) => sum + c.availableLimit, 0);
  }, [cards]);

  return {
    cards,
    installments,
    statements,
    loading,
    error,
    addCard,
    updateCard,
    deleteCard,
    createInstallmentPurchase,
    payStatement,
    anticipateInstallment,
    getCardInstallments,
    getTotalCreditLimit,
    getTotalCreditUsed,
    getTotalAvailableLimit
  };
}
