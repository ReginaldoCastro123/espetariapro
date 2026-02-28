'use function';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import Layout from './Layout';

// Adicionamos a prop aqui
interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean; 
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { isExpired } = useSubscription();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Se ainda estiver carregando, não faz nada
    if (isLoading) return;

    // A MÁGICA CONTRA O TILT ESTÁ AQUI:
    // Só redireciona se não estiver autenticado E se a página atual não for o /login
    if (!isAuthenticated) {
      if (pathname !== '/login') {
        router.replace('/login');
      }
      return;
    }

    // Se a rota exige admin (adminOnly=true) e o user não for admin, bloqueia
    // (Você precisaria integrar isso com seu AuthContext)
    
    // Se a assinatura expirou e ele não está na tela de assinatura, redireciona
    if (isExpired && pathname !== '/assinatura') {
      router.replace('/assinatura');
    }
  }, [isLoading, isAuthenticated, isExpired, pathname, router, adminOnly]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-fire-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Previne renderizar o conteúdo protegido se não estiver autenticado
  if (!isAuthenticated) return null;
  if (isExpired && pathname !== '/assinatura') return null;

  return <Layout>{children}</Layout>;
}