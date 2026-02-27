'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import Layout from './Layout';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { isExpired } = useSubscription(); // Capturamos o estado de expiração
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 1. Se ainda está carregando, não faz nada
    if (isLoading) return;

    // 2. Se não está logado, manda pro login
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // 3. SE A ASSINATURA EXPIROU e o usuário NÃO está na página de assinatura:
    // Bloqueia e manda pra lá!
    if (isExpired && pathname !== '/assinatura') {
      router.replace('/assinatura');
    }
  }, [isLoading, isAuthenticated, isExpired, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-fire-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Se a assinatura estiver expirada, não renderiza o conteúdo da página, 
  // apenas o layout (para ele ver o botão de renovar no menu ou topo)
  if (isExpired && pathname !== '/assinatura') return null;

  return <Layout>{children}</Layout>;
}