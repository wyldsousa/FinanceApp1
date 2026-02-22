import { useState, useEffect, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import type { User, UserSettings } from '@/types';

// Error message mapper for Firebase Auth errors
const getErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    'auth/invalid-email': 'Email inválido',
    'auth/user-disabled': 'Esta conta foi desativada',
    'auth/user-not-found': 'Usuário não encontrado',
    'auth/wrong-password': 'Senha incorreta',
    'auth/email-already-in-use': 'Este email já está em uso',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres',
    'auth/invalid-credential': 'Email ou senha incorretos',
    'auth/network-request-failed': 'Erro de conexão. Verifique sua internet',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
    'auth/api-key-not-valid': 'Chave de API inválida. Contate o suporte',
    'auth/invalid-api-key': 'Chave de API inválida. Contate o suporte'
  };
  
  return errorMessages[errorCode] || 'Ocorreu um erro. Tente novamente';
};

const defaultSettings: UserSettings = {
  theme: 'dark',
  language: 'pt-BR',
  notificationsEnabled: true,
  currency: 'BRL'
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              id: fbUser.uid,
              email: fbUser.email || '',
              name: userData.name || fbUser.displayName || '',
              photoURL: userData.photoURL || '',
              settings: { ...defaultSettings, ...userData.settings },
              createdAt: userData.createdAt?.toDate() || new Date(),
              updatedAt: userData.updatedAt?.toDate() || new Date()
            });
          } else {
            // Create user document if doesn't exist
            const newUser = {
              name: fbUser.displayName || '',
              email: fbUser.email || '',
              photoURL: fbUser.photoURL || '',
              settings: defaultSettings,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            await setDoc(doc(db, 'users', fbUser.uid), newUser);
            
            setUser({
              id: fbUser.uid,
              email: fbUser.email || '',
              name: fbUser.displayName || '',
              photoURL: fbUser.photoURL || '',
              settings: defaultSettings,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err: any) {
      const errorMessage = getErrorMessage(err.code);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    setError(null);
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile
      await updateProfile(result.user, { displayName: name });
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        name,
        email,
        photoURL: '',
        settings: defaultSettings,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Create default bank account
      await setDoc(doc(db, 'bankAccounts', crypto.randomUUID()), {
        userId: result.user.uid,
        name: 'Conta Principal',
        balance: 0,
        type: 'checking',
        color: '#3b82f6',
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Create default categories
      const defaultCategories = [
        { name: 'Salário', type: 'income', color: '#22c55e', icon: 'wallet' },
        { name: 'Investimentos', type: 'income', color: '#3b82f6', icon: 'trending-up' },
        { name: 'Alimentação', type: 'expense', color: '#ef4444', icon: 'utensils' },
        { name: 'Transporte', type: 'expense', color: '#f97316', icon: 'car' },
        { name: 'Moradia', type: 'expense', color: '#8b5cf6', icon: 'home' },
        { name: 'Lazer', type: 'expense', color: '#ec4899', icon: 'gamepad-2' },
        { name: 'Saúde', type: 'expense', color: '#06b6d4', icon: 'heart' },
        { name: 'Educação', type: 'expense', color: '#14b8a6', icon: 'book-open' }
      ];
      
      for (const category of defaultCategories) {
        await setDoc(doc(db, 'categories', crypto.randomUUID()), {
          ...category,
          userId: result.user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      return result.user;
    } catch (err: any) {
      const errorMessage = getErrorMessage(err.code);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
    } catch (err: any) {
      const errorMessage = getErrorMessage(err.code);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      const errorMessage = getErrorMessage(err.code);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserProfile = useCallback(async (data: Partial<User>) => {
    if (!firebaseUser) return;
    
    setLoading(true);
    try {
      if (data.name) {
        await updateProfile(firebaseUser, { displayName: data.name });
      }
      
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        ...data,
        updatedAt: serverTimestamp()
      });
      
      setUser(prev => prev ? { ...prev, ...data, updatedAt: new Date() } : null);
    } catch (err: any) {
      const errorMessage = getErrorMessage(err.code);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  const updateUserSettings = useCallback(async (settings: Partial<UserSettings>) => {
    if (!firebaseUser) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        settings: { ...user?.settings, ...settings },
        updatedAt: serverTimestamp()
      });
      
      setUser(prev => prev ? { 
        ...prev, 
        settings: { ...prev.settings, ...settings },
        updatedAt: new Date() 
      } : null);
    } catch (err: any) {
      console.error('Error updating settings:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, user?.settings]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    firebaseUser,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    resetPassword,
    updateUserProfile,
    updateUserSettings,
    clearError
  };
}
