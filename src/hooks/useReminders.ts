import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Reminder } from '@/types';

export function useReminders(userId: string | undefined) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setReminders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const q = query(
      collection(db, 'reminders'),
      where('userId', '==', userId),
      orderBy('dueDate', 'asc')
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
          } as Reminder;
        });
        setReminders(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching reminders:', err);
        setError('Erro ao carregar lembretes');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const addReminder = useCallback(async (reminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'reminders'), {
        ...reminder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar lembrete');
      throw err;
    }
  }, []);

  const updateReminder = useCallback(async (id: string, data: Partial<Reminder>) => {
    try {
      await updateDoc(doc(db, 'reminders', id), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar lembrete');
      throw err;
    }
  }, []);

  const deleteReminder = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'reminders', id));
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir lembrete');
      throw err;
    }
  }, []);

  const completeReminder = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, 'reminders', id), {
        isCompleted: true,
        updatedAt: serverTimestamp()
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao completar lembrete');
      throw err;
    }
  }, []);

  // Create next recurring reminder
  const createNextRecurringReminder = useCallback(async (reminder: Reminder) => {
    if (!reminder.isRecurring || !reminder.recurringPeriod) return;

    const nextDueDate = new Date(reminder.dueDate);
    
    switch (reminder.recurringPeriod) {
      case 'daily':
        nextDueDate.setDate(nextDueDate.getDate() + 1);
        break;
      case 'weekly':
        nextDueDate.setDate(nextDueDate.getDate() + 7);
        break;
      case 'monthly':
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        break;
      case 'yearly':
        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
        break;
    }

    try {
      await addDoc(collection(db, 'reminders'), {
        userId: reminder.userId,
        title: reminder.title,
        description: reminder.description,
        amount: reminder.amount,
        dueDate: nextDueDate,
        category: reminder.category,
        isRecurring: reminder.isRecurring,
        recurringPeriod: reminder.recurringPeriod,
        isCompleted: false,
        notificationEnabled: reminder.notificationEnabled,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (err: any) {
      console.error('Error creating next recurring reminder:', err);
    }
  }, []);

  const getUpcoming = useCallback((days: number = 7) => {
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + days);

    return reminders.filter(r => {
      if (r.isCompleted) return false;
      const dueDate = new Date(r.dueDate);
      return dueDate >= now && dueDate <= future;
    });
  }, [reminders]);

  const getOverdue = useCallback(() => {
    const now = new Date();
    return reminders.filter(r => {
      if (r.isCompleted) return false;
      const dueDate = new Date(r.dueDate);
      return dueDate < now;
    });
  }, [reminders]);

  const getTodayReminders = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return reminders.filter(r => {
      if (r.isCompleted) return false;
      const dueDate = new Date(r.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    });
  }, [reminders]);

  return {
    reminders,
    loading,
    error,
    addReminder,
    updateReminder,
    deleteReminder,
    completeReminder,
    createNextRecurringReminder,
    getUpcoming,
    getOverdue,
    getTodayReminders
  };
}
