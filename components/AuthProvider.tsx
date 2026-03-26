'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { supabase } from '@/lib/supabase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  level: 'Iniciante' | 'Básico' | 'Intermediário' | 'Avançado' | 'untested';
  currentModule: string;
  role: 'user' | 'admin';
  active?: boolean;
  plan?: 'free' | 'premium';
  interactionsToday?: number;
  lastInteractionDate?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt?: string;
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

  const syncUserData = async (firebaseUser: FirebaseUser, forceRefresh = false) => {
    const today = new Date().toISOString().split('T')[0];

    const { data: existingUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('uid', firebaseUser.uid)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user:', error);
    }

    if (existingUser && !forceRefresh) {
      const lastDate = existingUser.last_interaction_date;
      let interactionsToday = existingUser.interactions_today;
      
      if (lastDate !== today) {
        interactionsToday = 0;
        await supabase
          .from('users')
          .update({ 
            interactions_today: 0,
            last_interaction_date: today 
          })
          .eq('uid', firebaseUser.uid);
      }

      if (existingUser.active === false) {
        alert('Sua conta foi inativada pelo administrador. Entre em contato para mais informações.');
        signOut(auth);
        setUser(null);
        setUserData(null);
        return;
      }

      setUserData({
        uid: existingUser.uid,
        email: existingUser.email,
        displayName: existingUser.display_name || '',
        photoURL: existingUser.photo_url || '',
        level: existingUser.level as UserData['level'],
        currentModule: existingUser.current_module,
        role: existingUser.role as UserData['role'],
        active: existingUser.active,
        plan: existingUser.plan as UserData['plan'],
        interactionsToday,
        lastInteractionDate: existingUser.last_interaction_date || today,
        stripeCustomerId: existingUser.stripe_customer_id || '',
        stripeSubscriptionId: existingUser.stripe_subscription_id || '',
        createdAt: existingUser.created_at,
      });
    } else {
      const newUserData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        display_name: firebaseUser.displayName || '',
        photo_url: firebaseUser.photoURL || '',
        level: 'untested',
        xp: 0,
        current_module: '1.1',
        role: firebaseUser.email === 'professorajato@gmail.com' ? 'admin' : 'user',
        active: true,
        plan: 'free',
        interactions_today: 0,
        last_interaction_date: today,
      };

      const { error: insertError } = await supabase
        .from('users')
        .insert(newUserData);

      if (insertError) {
        handleFirestoreError(insertError, OperationType.CREATE, `users/${firebaseUser.uid}`);
      }

      await logAccess(firebaseUser.uid, firebaseUser.email || '', true);

      setUserData({
        uid: newUserData.uid,
        email: newUserData.email,
        displayName: newUserData.display_name,
        photoURL: newUserData.photo_url,
        level: newUserData.level as UserData['level'],
        currentModule: newUserData.current_module,
        role: newUserData.role as UserData['role'],
        active: newUserData.active,
        plan: newUserData.plan as UserData['plan'],
        interactionsToday: 0,
        lastInteractionDate: today,
      });
    }
  };

  const logAccess = async (userId: string, email: string, isLogin = false) => {
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      
      await supabase
        .from('access_logs')
        .insert({
          user_id: userId,
          email: email,
          ip_address: ipData.ip,
          user_agent: typeof window !== 'undefined' ? navigator.userAgent : null,
        });

      const { data: stats } = await supabase
        .from('global_stats')
        .select('*')
        .eq('id', 1)
        .single();

      if (stats) {
        await supabase
          .from('global_stats')
          .update({
            total_logins: stats.total_logins + (isLogin ? 1 : 0),
            total_users: stats.total_users + (isLogin ? 1 : 0),
            updated_at: new Date().toISOString(),
          })
          .eq('id', 1);
      }
    } catch (err) {
      console.error('Error logging access:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        await syncUserData(firebaseUser);
        await logAccess(firebaseUser.uid, firebaseUser.email || '');
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
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