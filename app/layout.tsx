import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles
import { AuthProvider } from '@/components/AuthProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Professor Jato',
  description: 'Plataforma de aprendizado de inglês para brasileiros com foco em situações reais.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} scroll-smooth`}>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className="font-sans antialiased text-slate-900" suppressHydrationWarning>
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
