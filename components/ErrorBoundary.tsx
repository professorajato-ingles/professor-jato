'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Ocorreu um erro inesperado.";
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            isFirestoreError = true;
            errorMessage = `Erro de permissão no banco de dados (${parsed.operationType} em ${parsed.path}). Verifique se você está logado corretamente.`;
          }
        }
      } catch (e) {
        // Not a JSON error message
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Ops! Algo deu errado</h2>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            {errorMessage}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full font-bold hover:bg-slate-800 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Recarregar Página
          </button>
          {isFirestoreError && (
            <p className="mt-6 text-xs text-slate-400">
              Se o erro persistir, entre em contato com o suporte técnico.
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
