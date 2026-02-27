'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { orderService } from '@/services/orders';
import { Order } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search,
  ClipboardList,
  Calendar,
  User,
  Table,
  DollarSign,
  CreditCard,
  X,
} from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const data = await orderService.list();
      setOrders(data);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCloseOrder(id: string, paymentMethod: string) {
    try {
      await orderService.close(id, paymentMethod);
      loadOrders();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao fechar pedido');
    }
  }

  async function handleCancelOrder(id: string) {
    if (!confirm('Tem certeza que deseja cancelar este pedido?')) return;

    try {
      await orderService.cancel(id);
      loadOrders();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao cancelar pedido');
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.waiter.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('pt-BR');
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

  function getStatusColor(status: string) {
    switch (status) {
      case 'OPEN':
        return 'bg-fire-500/20 text-fire-500';
      case 'CLOSED':
        return 'bg-green-500/20 text-green-500';
      case 'CANCELLED':
        return 'bg-wine-500/20 text-wine-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'OPEN':
        return 'Aberto';
      case 'CLOSED':
        return 'Fechado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex gap-3 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Buscar pedidos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-w-[150px]"
            >
              <option value="">Todos status</option>
              <option value="OPEN">Abertos</option>
              <option value="CLOSED">Fechados</option>
              <option value="CANCELLED">Cancelados</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fire-500"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="card text-center py-12">
            <ClipboardList size={48} className="mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400">Nenhum pedido encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="card">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-dark-700 rounded-lg flex items-center justify-center">
                      <ClipboardList size={24} className="text-fire-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">
                          Pedido #{order.id.slice(0, 8)}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Table size={14} />
                          {order.table.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <User size={14} />
                          {order.waiter.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-fire-500">
                        {formatCurrency(Number(order.totalAmount))}
                      </p>
                      {order.paymentMethod && (
                        <p className="text-sm text-gray-400 flex items-center justify-end gap-1">
                          <CreditCard size={14} />
                          {formatPaymentMethod(order.paymentMethod)}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="btn-secondary"
                      >
                        Ver
                      </button>
                      {order.status === 'OPEN' && (
                        <>
                          <button
                            onClick={() => handleCloseOrder(order.id, 'CASH')}
                            className="btn-success"
                          >
                            Fechar
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="btn-danger px-3"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="card w-full max-w-2xl max-h-[90vh] overflow-auto animate-fadeIn">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">
                    Pedido #{selectedOrder.id.slice(0, 8)}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-dark-700 rounded-lg">
                    <p className="text-sm text-gray-400">Mesa</p>
                    <p className="font-semibold">{selectedOrder.table.name}</p>
                  </div>
                  <div className="p-3 bg-dark-700 rounded-lg">
                    <p className="text-sm text-gray-400">Garçom</p>
                    <p className="font-semibold">{selectedOrder.waiter.name}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">
                    Itens do Pedido
                  </h3>
                  <div className="space-y-2">
                    {selectedOrder.orderItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-dark-700 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-400">
                            {item.quantity} x {formatCurrency(Number(item.price))}
                          </p>
                        </div>
                        <p className="font-semibold text-fire-500">
                          {formatCurrency(Number(item.price) * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-dark-700">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-fire-500">
                      {formatCurrency(Number(selectedOrder.totalAmount))}
                    </span>
                  </div>
                </div>
              </div>

              {selectedOrder.status === 'OPEN' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      handleCloseOrder(selectedOrder.id, 'CASH');
                      setSelectedOrder(null);
                    }}
                    className="btn-success flex-1"
                  >
                    <DollarSign size={16} />
                    Fechar (Dinheiro)
                  </button>
                  <button
                    onClick={() => {
                      handleCloseOrder(selectedOrder.id, 'CREDIT_CARD');
                      setSelectedOrder(null);
                    }}
                    className="btn-primary flex-1"
                  >
                    <CreditCard size={16} />
                    Fechar (Cartão)
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        handleCancelOrder(selectedOrder.id);
                        setSelectedOrder(null);
                      }}
                      className="btn-danger px-4"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
