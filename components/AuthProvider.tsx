'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  level: 'Iniciante' | 'Básico' | 'Intermediário' | 'Avançado' | 'untested';
  xp: number;
  currentModule: string;
  role: 'user' | 'admin';
  active?: boolean;
  plan?: 'free' | 'premium';
  interactionsToday?: number;
  lastInteractionDate?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | undefined;

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      
      // Clean up previous listener if it exists
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = undefined;
      }

      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserData;
            if (data.active === false) {
              alert('Sua conta foi inativada pelo administrador. Entre em contato para mais informações.');
              signOut(auth);
              setUser(null);
              setUserData(null);
            } else {
              const updates: Record<string, unknown> = {};
              
              if (!data.plan) updates.plan = 'free';
              if (typeof data.interactionsToday !== 'number') updates.interactionsToday = 0;
              if (!data.lastInteractionDate) updates.lastInteractionDate = new Date().toISOString().split('T')[0];
              if (!data.level) updates.level = 'untested';
              if (!data.currentModule) updates.currentModule = '1.1';
              if (typeof data.xp !== 'number') updates.xp = 0;
              
              if (Object.keys(updates).length > 0) {
                updateDoc(userRef, updates).catch(err => console.log('Migration error:', err));
              }
              
              setUserData({ ...data, ...updates } as UserData);
            }
          } else {
            // Create user document if it doesn't exist
            const newUserData: UserData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              level: 'untested',
              xp: 0,
              currentModule: '1.1',
              role: firebaseUser.email === 'professorajato@gmail.com' ? 'admin' : 'user',
              active: true,
              plan: 'free',
              interactionsToday: 0,
              lastInteractionDate: new Date().toISOString().split('T')[0],
            };
            setDoc(userRef, newUserData).catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}`));
            setUserData(newUserData);
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        });
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
      }
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      console.log('Attempting Google Sign-In...');
      await signInWithPopup(auth, provider);
      console.log('Google Sign-In successful');
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      if (error.code === 'auth/network-request-failed') {
        alert('Erro de rede ao tentar fazer login. Verifique sua conexão ou se algum bloqueador de anúncios está impedindo o acesso ao Google Auth.');
      } else if (error.code === 'auth/popup-blocked') {
        alert('O popup de login foi bloqueado pelo seu navegador. Por favor, permita popups para este site.');
      } else {
        alert(`Erro ao entrar com Google: ${error.message}`);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
