'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { subscriptionService, SubscriptionData } from '@/services/subscriptions';
import { useSubscription } from '@/contexts/SubscriptionContext';
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
  const { checkSubscription } = useSubscription();

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

  async function handleUpgrade() {
    try {
      await subscriptionService.upgradeToEnterprise();
      await checkSubscription();
      loadSubscription();
      setShowUpgradeModal(false);
      alert('Assinatura Enterprise ativada com sucesso!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao fazer upgrade');
    }
  }

  async function handleRenew() {
    try {
      await subscriptionService.renew();
      await checkSubscription();
      loadSubscription();
      alert('Assinatura renovada com sucesso!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao renovar assinatura');
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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

  return (
    <ProtectedRoute adminOnly>
      <div className="space-y-6">
        {/* Expired Alert */}
        {isExpired && (
          <div className="bg-wine-500/20 border border-wine-500 rounded-xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-wine-500 rounded-full flex items-center justify-center">
              <AlertTriangle size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">Assinatura Expirada</h2>
              <p className="text-gray-300">
                Sua assinatura expirou. Renove agora para continuar usando todas as funcionalidades.
              </p>
            </div>
            <button onClick={handleRenew} className="btn-primary">
              Renovar Agora
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Current Plan */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-fire-500 rounded-xl flex items-center justify-center">
                <CreditCard size={32} className="text-white" />
              </div>
              <div>
                <p className="text-gray-400">Plano Atual</p>
                <h2 className="text-2xl font-bold text-white">
                  {isEnterprise ? 'Enterprise' : 'Free'}
                </h2>
                <span
                  className={`text-sm ${
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
              <div className="text-right">
                <p className="text-gray-400">Válido até</p>
                <p className="text-xl font-semibold">
                  {formatDate(subscription.endDate)}
                </p>
              </div>
            )}
          </div>

          {/* Usage Stats */}
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

          {/* Actions */}
          {!isEnterprise && (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="btn-primary w-full"
            >
              <Flame size={18} />
              Fazer Upgrade para Enterprise
            </button>
          )}

          {isEnterprise && !isExpired && (
            <button onClick={handleRenew} className="btn-secondary w-full">
              <Calendar size={18} />
              Renovar Assinatura
            </button>
          )}
        </div>

        {/* Plans Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <div
            className={`card ${!isEnterprise ? 'border-fire-500/50' : ''}`}
          >
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

          {/* Enterprise Plan */}
          <div
            className={`card ${isEnterprise ? 'border-fire-500/50 bg-fire-500/5' : ''}`}
          >
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

            {!isEnterprise && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="btn-primary w-full"
              >
                Fazer Upgrade
              </button>
            )}
          </div>
        </div>

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="card w-full max-w-md animate-fadeIn">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Fazer Upgrade</h2>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-fire-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Flame size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Plano Enterprise</h3>
                <p className="text-3xl font-bold text-fire-500">
                  R$ 39,90
                  <span className="text-lg text-gray-400">/mês</span>
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-gray-300">
                  <Check size={18} className="text-green-500" />
                  Mesas ilimitadas
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Check size={18} className="text-green-500" />
                  Usuários ilimitados
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Check size={18} className="text-green-500" />
                  Histórico completo
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Check size={18} className="text-green-500" />
                  Dashboard avançado
                </div>
              </div>

              <p className="text-sm text-gray-400 text-center mb-6">
                Integração com gateway de pagamento em breve.
                Por enquanto, o upgrade é simulado.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button onClick={handleUpgrade} className="btn-primary flex-1">
                  Confirmar Upgrade
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
