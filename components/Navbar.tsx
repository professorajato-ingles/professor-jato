'use client';

import React from 'react';
import Link from 'next/link';
import { Star, LogOut } from 'lucide-react';
import { useAuth } from './AuthProvider';
import Image from 'next/image';

export const Navbar = () => {
  const { user, userData, signInWithGoogle, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-emerald-500 p-1.5 rounded-lg">
              <Star className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Professor <span className="text-emerald-500">Jato</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#metodo" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Método</Link>
            <Link href="#licoes" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Módulos</Link>
            <Link href="#precos" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Planos</Link>
            <Link href="#faq" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">FAQ</Link>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {userData?.photoURL ? (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-200">
                      <Image 
                        src={userData.photoURL} 
                        alt={userData.displayName || 'User'} 
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-sm">
                      {userData?.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="hidden md:block text-sm font-medium text-slate-700">
                    {userData?.displayName?.split(' ')[0]}
                  </span>
                </div>
                {(userData?.plan === 'premium' || userData?.plan === 'free') && (
                  userData.plan === 'premium' ? (
                    <span className="text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 px-3 py-1.5 rounded-full">
                      Premium
                    </span>
                  ) : (
                    <button 
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/checkout', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: user.uid, email: user.email })
                          });
                          const data = await res.json();
                          if (data.url) window.location.href = data.url;
                        } catch (e) {
                          console.error(e);
                          alert('Erro ao iniciar checkout');
                        }
                      }}
                      className="text-xs font-bold bg-amber-400 text-amber-900 px-3 py-1.5 rounded-full hover:bg-amber-300 transition-colors shadow-sm"
                    >
                      Upgrade Premium
                    </button>
                  )
                )}
                <button 
                  onClick={logout}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={signInWithGoogle} 
                className="hidden md:block text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
              >
                Entrar
              </button>
            )}
            {!user && (
              <Link href="#precos" className="bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm hover:shadow-md">
                Começar Agora
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
