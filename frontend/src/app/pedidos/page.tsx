'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { orderService } from '@/services/orders';
import { Order } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import Swal from 'sweetalert2';
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
      Swal.fire({
        title: 'Fechado!',
        text: 'Pedido encerrado com sucesso.',
        icon: 'success',
        background: '#18181b',
        color: '#ffffff',
        confirmButtonColor: '#f97316',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error: any) {
      Swal.fire({
        title: 'Erro!',
        text: error.response?.data?.error || 'Erro ao fechar pedido',
        icon: 'error',
        background: '#18181b',
        color: '#ffffff',
        confirmButtonColor: '#f97316'
      });
    }
  }

  async function handleCancelOrder(id: string) {
    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: "Deseja realmente cancelar este pedido?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f97316',
      cancelButtonColor: '#27272a',
      confirmButtonText: 'Sim, cancelar!',
      cancelButtonText: 'Voltar',
      background: '#18181b',
      color: '#ffffff'
    });

    if (!result.isConfirmed) return;

    try {
      await orderService.cancel(id);
      loadOrders();
      
      Swal.fire({
        title: 'Cancelado!',
        text: 'O pedido foi cancelado com sucesso.',
        icon: 'success',
        background: '#18181b',
        color: '#ffffff',
        confirmButtonColor: '#f97316',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error: any) {
      Swal.fire({
        title: 'Erro!',
        text: error.response?.data?.error || 'Erro ao cancelar pedido',
        icon: 'error',
        background: '#18181b',
        color: '#ffffff',
        confirmButtonColor: '#f97316'
      });
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
        {/* Header - Ajustado para quebrar no celular */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-lg w-full">
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
              className="w-full sm:w-auto min-w-[150px]"
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
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  
                  {/* Informações do Pedido */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-dark-700 rounded-lg flex-shrink-0 flex items-center justify-center hidden sm:flex">
                      <ClipboardList size={24} className="text-fire-500" />
                    </div>
                    <div className="w-full">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
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
                      
                      {/* Flex-wrap adicionado aqui para a data não vazar */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-400 mt-2">
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

                  {/* Preço e Botões - Ajustado para alinhar direito no celular */}
                  <div className="flex flex-col sm:flex-row lg:items-center gap-4 w-full lg:w-auto pt-4 lg:pt-0 border-t border-dark-700 lg:border-t-0 mt-2 lg:mt-0">
                    <div className="flex justify-between items-center w-full sm:w-auto sm:text-right">
                      <span className="sm:hidden text-gray-400 font-medium">Total:</span>
                      <div>
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
                    </div>

                    {/* Botões empilhados ou lado a lado de forma fluída */}
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="btn-secondary flex-1 sm:flex-none"
                      >
                        Ver
                      </button>
                      {order.status === 'OPEN' && (
                        <>
                          <button
                            onClick={() => handleCloseOrder(order.id, 'CASH')}
                            className="btn-success flex-1 sm:flex-none"
                          >
                            Fechar
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="btn-danger flex-1 sm:flex-none px-3 flex justify-center"
                              title="Cancelar Pedido"
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
            <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold break-all">
                    Pedido #{selectedOrder.id.slice(0, 8)}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-white flex-shrink-0 p-1"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-dark-700 rounded-lg gap-2"
                      >
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-400">
                            {item.quantity} x {formatCurrency(Number(item.price))}
                          </p>
                        </div>
                        <p className="font-semibold text-fire-500 sm:text-right">
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

              {/* Botões do Modal empilhados no celular */}
              {selectedOrder.status === 'OPEN' && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      handleCloseOrder(selectedOrder.id, 'CASH');
                      setSelectedOrder(null);
                    }}
                    className="btn-success flex-1 flex justify-center items-center gap-2"
                  >
                    <DollarSign size={16} />
                    <span>Dinheiro</span>
                  </button>
                  <button
                    onClick={() => {
                      handleCloseOrder(selectedOrder.id, 'CREDIT_CARD');
                      setSelectedOrder(null);
                    }}
                    className="btn-primary flex-1 flex justify-center items-center gap-2"
                  >
                    <CreditCard size={16} />
                    <span>Cartão</span>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        handleCancelOrder(selectedOrder.id);
                        setSelectedOrder(null);
                      }}
                      className="btn-danger flex-1 sm:flex-none px-4"
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