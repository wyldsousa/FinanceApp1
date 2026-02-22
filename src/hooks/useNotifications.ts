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
import type { Notification, Reminder } from '@/types';

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const q = query(
      collection(db, 'notifications'),
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
            createdAt: d.createdAt?.toDate() || new Date()
          } as Notification;
        });
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.isRead).length);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching notifications:', err);
        setError('Erro ao carregar notificações');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const addNotification = useCallback(async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (err: any) {
      console.error('Error adding notification:', err);
      throw err;
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), {
        isRead: true
      });
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      
      for (const notification of unreadNotifications) {
        await updateDoc(doc(db, 'notifications', notification.id), {
          isRead: true
        });
      }
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  }, [notifications]);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      throw err;
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    try {
      for (const notification of notifications) {
        await deleteDoc(doc(db, 'notifications', notification.id));
      }
    } catch (err: any) {
      console.error('Error clearing notifications:', err);
      throw err;
    }
  }, [notifications]);

  // Create notification for reminder
  const createReminderNotification = useCallback(async (reminder: Reminder) => {
    if (!reminder.notificationEnabled) return;

    try {
      await addDoc(collection(db, 'notifications'), {
        userId: reminder.userId,
        title: 'Lembrete: ' + reminder.title,
        message: `Vencimento em ${new Date(reminder.dueDate).toLocaleDateString('pt-BR')} - Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(reminder.amount)}`,
        type: 'reminder',
        isRead: false,
        data: { reminderId: reminder.id },
        createdAt: serverTimestamp()
      });
    } catch (err: any) {
      console.error('Error creating reminder notification:', err);
    }
  }, []);

  // Create notification for transaction
  const createTransactionNotification = useCallback(async (
    userId: string,
    type: 'income' | 'expense',
    amount: number,
    description: string
  ) => {
    try {
      const formattedAmount = new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(amount);

      await addDoc(collection(db, 'notifications'), {
        userId,
        title: type === 'income' ? 'Nova Receita' : 'Nova Despesa',
        message: `${description}: ${formattedAmount}`,
        type: 'transaction',
        isRead: false,
        createdAt: serverTimestamp()
      });
    } catch (err: any) {
      console.error('Error creating transaction notification:', err);
    }
  }, []);

  // Create alert notification
  const createAlertNotification = useCallback(async (
    userId: string,
    title: string,
    message: string
  ) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId,
        title,
        message,
        type: 'alert',
        isRead: false,
        createdAt: serverTimestamp()
      });
    } catch (err: any) {
      console.error('Error creating alert notification:', err);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    createReminderNotification,
    createTransactionNotification,
    createAlertNotification
  };
}
