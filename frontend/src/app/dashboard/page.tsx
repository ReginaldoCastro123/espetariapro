'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { dashboardService } from '@/services/dashboard';
import { DashboardStats } from '@/types';
import {
  DollarSign,
  TrendingUp,
  Table,
  Package,
  CreditCard,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#ff5e00', '#8b0000', '#00c853', '#2962ff', '#ffd600'];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (err: any) {
      setError('Erro ao carregar estatísticas');
    } finally {
      setIsLoading(false);
    }
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  function formatPaymentMethod(method: string | null) {
    if (!method) return '-';
    const methods: Record<string, string> = {
      CASH: 'Dinheiro',
      CREDIT_CARD: 'Cartão de Crédito',
      DEBIT_CARD: 'Cartão de Débito',
      PIX: 'PIX',
    };
    return methods[method] || method;
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fire-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="bg-wine-500/20 border border-wine-500 text-wine-500 px-4 py-3 rounded-lg">
          {error}
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today Sales */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Vendas Hoje</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(stats?.todaySales || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-fire-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="text-fire-500" size={24} />
              </div>
            </div>
          </div>

          {/* Month Sales */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Vendas do Mês</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(stats?.monthSales || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-green-500" size={24} />
              </div>
            </div>
          </div>

          {/* Open Tables */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Mesas Abertas</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.openTables || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Table className="text-blue-500" size={24} />
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Plano</p>
                <p className="text-lg font-bold text-white">
                  {stats?.subscription?.plan === 'ENTERPRISE' ? 'Enterprise' : 'Free'}
                </p>
                {stats?.subscription?.status === 'TRIAL' && (
                  <p className="text-xs text-fire-500">
                    {stats.subscription.daysRemaining} dias restantes
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <CreditCard className="text-purple-500" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales by Day Chart */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-fire-500" />
              Vendas por Dia (Últimos 7 dias)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.salesByDay || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis
                    dataKey="dayName"
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => `R$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="total" fill="#ff5e00" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Products */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Package size={20} className="text-fire-500" />
              Produtos Mais Vendidos
            </h3>
            <div className="space-y-3">
              {stats?.topProducts?.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  Nenhuma venda registrada
                </p>
              ) : (
                stats?.topProducts?.map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-dark-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-fire-500 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-white">{product.name}</p>
                        <p className="text-sm text-gray-400">{product.category}</p>
                      </div>
                    </div>
                    <span className="text-fire-500 font-semibold">
                      {product.totalSold} vendidos
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CreditCard size={20} className="text-fire-500" />
            Vendas por Forma de Pagamento
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.salesByPayment || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ method, percent }) =>
                      `${formatPaymentMethod(method)} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total"
                  >
                    {(stats?.salesByPayment || []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {stats?.salesByPayment?.map((payment, index) => (
                <div
                  key={payment.method}
                  className="flex items-center justify-between p-3 bg-dark-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-white">
                      {formatPaymentMethod(payment.method)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">
                      {formatCurrency(payment.total)}
                    </p>
                    <p className="text-sm text-gray-400">
                      {payment.count} vendas
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Product Alert */}
        {stats?.topProduct && (
          <div className="card bg-gradient-to-r from-fire-500/10 to-wine-500/10 border-fire-500/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-fire-500 rounded-lg flex items-center justify-center">
                <Package className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Produto Mais Vendido</p>
                <p className="text-xl font-bold text-white">
                  {stats.topProduct.name}
                </p>
                <p className="text-sm text-fire-500">
                  {stats.topProduct.totalSold} unidades vendidas
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
