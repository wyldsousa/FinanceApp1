import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Category } from '@/types';

export function useCategories(userId: string | undefined) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const q = query(
      collection(db, 'categories'),
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
            createdAt: d.createdAt?.toDate() || new Date(),
            updatedAt: d.updatedAt?.toDate() || new Date()
          } as Category;
        });
        setCategories(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching categories:', err);
        setError('Erro ao carregar categorias');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const addCategory = useCallback(async (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'categories'), {
        ...category,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar categoria');
      throw err;
    }
  }, []);

  const updateCategory = useCallback(async (id: string, data: Partial<Category>) => {
    try {
      await updateDoc(doc(db, 'categories', id), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar categoria');
      throw err;
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir categoria');
      throw err;
    }
  }, []);

  const getByType = useCallback((type: 'income' | 'expense') => {
    return categories.filter(c => c.type === type);
  }, [categories]);

  return {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    getByType
  };
}
