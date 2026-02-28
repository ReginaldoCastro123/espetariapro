'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { subscriptionService, SubscriptionData } from '@/services/subscriptions';
// import { useSubscription } from '@/contexts/SubscriptionContext'; <-- Mantido caso você precise depois
import SubscriptionModal from '@/components/SubscriptionModal';
import {
  CreditCard,
  Check,
  AlertTriangle,
  Flame,
  Users,
  Table,
  Calendar,
  ArrowRight,
  X,
} from 'lucide-react';

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  async function loadSubscription() {
    try {
      const data = await subscriptionService.get();
      setSubscription(data);
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  if (isLoading) {
    return (
      <ProtectedRoute adminOnly>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fire-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  const isExpired = subscription?.isExpired;
  const isTrial = subscription?.status === 'TRIAL';
  const isEnterprise = subscription?.plan === 'ENTERPRISE';

  // Cálculo de quantos dias faltam para a assinatura vencer
  const daysUntilExpiration = subscription?.endDate
    ? Math.ceil((new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Só é considerado perto de expirar se faltar 5 dias ou menos
  const isCloseToExpiring = daysUntilExpiration !== null && daysUntilExpiration <= 5;

  return (
    <ProtectedRoute adminOnly>
      <div className="space-y-6">
        {/* Aviso de Assinatura Expirada */}
        {isExpired && (
          <div className="bg-wine-500/20 border border-wine-500 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 bg-wine-500 rounded-full flex items-center justify-center shrink-0">
              <AlertTriangle size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">Assinatura Expirada</h2>
              <p className="text-gray-300">
                Sua assinatura expirou. Renove agora para continuar usando todas as funcionalidades.
              </p>
            </div>
            <button onClick={() => setShowUpgradeModal(true)} className="btn-primary w-full sm:w-auto mt-4 sm:mt-0">
              Renovar Agora
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Card do Plano Atual */}
        <div className="card">
          {/* A MÁGICA ESTÁ AQUI: flex-col no celular, sm:flex-row no computador! */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-fire-500 rounded-xl flex items-center justify-center shrink-0">
                <CreditCard size={32} className="text-white" />
              </div>
              <div>
                <p className="text-gray-400">Plano Atual</p>
                <h2 className="text-2xl font-bold text-white leading-tight">
                  {isEnterprise ? 'Enterprise' : 'Free'}
                </h2>
                <span
                  className={`text-sm inline-block mt-1 ${
                    isExpired
                      ? 'text-wine-500'
                      : isTrial
                      ? 'text-fire-500'
                      : 'text-green-500'
                  }`}
                >
                  {isExpired
                    ? 'Expirado'
                    : isTrial
                    ? 'Trial'
                    : subscription?.status === 'ACTIVE'
                    ? 'Ativo'
                    : subscription?.status}
                </span>
              </div>
            </div>

            {subscription?.endDate && (
              <div className="text-left sm:text-right w-full sm:w-auto mt-2 sm:mt-0 p-3 sm:p-0 bg-dark-700 sm:bg-transparent rounded-lg sm:rounded-none">
                <p className="text-gray-400">Válido até</p>
                <p className="text-xl font-semibold">
                  {formatDate(subscription.endDate)}
                </p>
                {/* Mostra um aviso pequeno se estiver quase vencendo */}
                {isCloseToExpiring && !isExpired && (
                  <p className="text-sm text-fire-500 mt-1">Vence em {daysUntilExpiration} dias</p>
                )}
              </div>
            )}
          </div>

          {/* Estatísticas de Uso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-dark-700 rounded-lg flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Table size={20} className="text-blue-500" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Mesas</p>
                <p className="font-semibold">
                  {subscription?.tableCount || 0}{' '}
                  {subscription?.limits.maxTables && (
                    <span className="text-gray-500">
                      / {subscription.limits.maxTables}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="p-4 bg-dark-700 rounded-lg flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Users size={20} className="text-purple-500" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Usuários</p>
                <p className="font-semibold">
                  {subscription?.userCount || 0}{' '}
                  {subscription?.limits.maxUsers && (
                    <span className="text-gray-500">
                      / {subscription.limits.maxUsers}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Ações / Botões */}
          {!isEnterprise && (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="btn-primary w-full"
            >
              <Flame size={18} />
              Fazer Upgrade para Enterprise
            </button>
          )}

          {isEnterprise && (isExpired || isCloseToExpiring) && (
            <button onClick={() => setShowUpgradeModal(true)} className="btn-secondary w-full">
              <Calendar size={18} />
              Renovar Assinatura
            </button>
          )}
        </div>

        {/* Comparação de Planos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plano Free */}
          <div className={`card ${!isEnterprise ? 'border-fire-500/50' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Free</h3>
              {!isEnterprise && (
                <span className="px-3 py-1 bg-fire-500/20 text-fire-500 rounded-full text-sm">
                  Atual
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-white mb-6">
              R$ 0
              <span className="text-lg text-gray-400">/mês</span>
            </p>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-gray-300">
                <Check size={18} className="text-green-500" />
                Máximo 10 mesas ativas
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <Check size={18} className="text-green-500" />
                Máximo 5 usuários
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <Check size={18} className="text-green-500" />
                Histórico de 30 dias
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <Check size={18} className="text-green-500" />
                15 dias de trial
              </li>
              <li className="flex items-center gap-2 text-gray-500">
                <X size={18} className="text-wine-500" />
                Dashboard avançado
              </li>
              <li className="flex items-center gap-2 text-gray-500">
                <X size={18} className="text-wine-500" />
                Controle por garçom
              </li>
            </ul>
          </div>

          {/* Plano Enterprise */}
          <div className={`card ${isEnterprise ? 'border-fire-500/50 bg-fire-500/5' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Enterprise</h3>
              {isEnterprise && (
                <span className="px-3 py-1 bg-fire-500/20 text-fire-500 rounded-full text-sm">
                  Atual
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-fire-500 mb-6">
              R$ 39,90
              <span className="text-lg text-gray-400">/mês</span>
            </p>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-gray-300">
                <Check size={18} className="text-green-500" />
                <strong>Mesas ilimitadas</strong>
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <Check size={18} className="text-green-500" />
                <strong>Usuários ilimitados</strong>
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <Check size={18} className="text-green-500" />
                <strong>Histórico completo</strong>
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <Check size={18} className="text-green-500" />
                Dashboard avançado
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <Check size={18} className="text-green-500" />
                Controle por garçom
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <Check size={18} className="text-green-500" />
                Dados ilimitados
              </li>
            </ul>
          </div>
        </div>

        {/* Modal que vai exibir o QRCode do PIX quando alguém clicar em "Fazer Upgrade" ou "Renovar" */}
        <SubscriptionModal 
          isOpen={showUpgradeModal} 
          onClose={() => setShowUpgradeModal(false)} 
        />
        
      </div>
    </ProtectedRoute>
  );
}