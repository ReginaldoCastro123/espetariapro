'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { subscriptionService, SubscriptionData } from '@/services/subscriptions';

interface SubscriptionContextData {
  subscription: SubscriptionData | null;
  isLoading: boolean;
  isExpired: boolean;
  checkSubscription: () => Promise<void>;
  upgrade: () => Promise<void>;
  renew: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextData>({} as SubscriptionContextData);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkSubscription();
  }, []);

  async function checkSubscription() {
    try {
      const data = await subscriptionService.get();
      setSubscription(data);
      
      // Se expirado, redireciona para página de renovação
      if (data.isExpired && window.location.pathname !== '/assinatura') {
        router.push('/assinatura');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function upgrade() {
    try {
      const data = await subscriptionService.upgradeToEnterprise();
      setSubscription(data.subscription);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erro ao fazer upgrade');
    }
  }

  async function renew() {
    try {
      const data = await subscriptionService.renew();
      setSubscription(data.subscription);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erro ao renovar assinatura');
    }
  }

  const isExpired = subscription?.isExpired || false;

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isLoading,
        isExpired,
        checkSubscription,
        upgrade,
        renew,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);
