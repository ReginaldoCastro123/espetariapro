'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { tableService } from '@/services/tables';
import { orderService } from '@/services/orders';
import { productService } from '@/services/products';
import { Table, Product, Order } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Check,
  Table as TableIcon,
  Utensils,
  DollarSign,
  User,
} from 'lucide-react';

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTableModal, setShowTableModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableName, setTableName] = useState('');
  const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number }[]>([]);
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    loadTables();
    loadProducts();
  }, []);

  async function loadTables() {
    try {
      const data = await tableService.list();
      setTables(data);
    } catch (error) {
      console.error('Erro ao carregar mesas:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadProducts() {
    try {
      const data = await productService.list();
      setProducts(data.filter((p) => p.active));
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  }

  async function handleCreateTable(e: React.FormEvent) {
    e.preventDefault();
    try {
      await tableService.create(tableName);
      setShowTableModal(false);
      setTableName('');
      loadTables();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao criar mesa');
    }
  }

  async function handleUpdateTable(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTable) return;

    try {
      await tableService.update(editingTable.id, tableName);
      setShowTableModal(false);
      setEditingTable(null);
      setTableName('');
      loadTables();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao atualizar mesa');
    }
  }

  async function handleDeleteTable(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta mesa?')) return;

    try {
      await tableService.delete(id);
      loadTables();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao excluir mesa');
    }
  }

  async function handleOpenTable(id: string) {
    try {
      await tableService.open(id);
      loadTables();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao abrir mesa');
    }
  }

  async function handleCloseTable(id: string) {
    try {
      await tableService.close(id);
      loadTables();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao fechar mesa');
    }
  }

  function handleOpenOrderModal(table: Table) {
    setSelectedTable(table);
    setOrderItems([]);
    setShowOrderModal(true);
  }

  function addOrderItem(productId: string) {
    const existing = orderItems.find((item) => item.productId === productId);
    if (existing) {
      setOrderItems(
        orderItems.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setOrderItems([...orderItems, { productId, quantity: 1 }]);
    }
  }

  function removeOrderItem(productId: string) {
    setOrderItems(orderItems.filter((item) => item.productId !== productId));
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      removeOrderItem(productId);
      return;
    }
    setOrderItems(
      orderItems.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  }

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTable || orderItems.length === 0) return;

    try {
      await orderService.create({
        tableId: selectedTable.id,
        items: orderItems,
      });
      setShowOrderModal(false);
      setSelectedTable(null);
      setOrderItems([]);
      loadTables();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao criar pedido');
    }
  }

  const filteredTables = tables.filter((table) =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  function getProductName(productId: string) {
    return products.find((p) => p.id === productId)?.name || 'Produto';
  }

  function getProductPrice(productId: string) {
    return products.find((p) => p.id === productId)?.price || 0;
  }

  function getOrderTotal() {
    return orderItems.reduce((total, item) => {
      return total + Number(getProductPrice(item.productId)) * item.quantity;
    }, 0);
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar mesas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10"
            />
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                setEditingTable(null);
                setTableName('');
                setShowTableModal(true);
              }}
              className="btn-primary"
            >
              <Plus size={20} />
              Nova Mesa
            </button>
          )}
        </div>

        {/* Tables Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fire-500"></div>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="card text-center py-12">
            <TableIcon size={48} className="mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400">Nenhuma mesa encontrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTables.map((table) => (
              <div
                key={table.id}
                className={`card ${
                  table.status === 'OPEN'
                    ? 'border-fire-500/50 bg-fire-500/5'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        table.status === 'OPEN'
                          ? 'bg-fire-500'
                          : 'bg-dark-700'
                      }`}
                    >
                      <TableIcon size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{table.name}</h3>
                      <span
                        className={`text-xs ${
                          table.status === 'OPEN'
                            ? 'text-fire-500'
                            : 'text-gray-400'
                        }`}
                      >
                        {table.status === 'OPEN' ? 'Aberta' : 'Livre'}
                      </span>
                    </div>
                  </div>
                  {isAdmin && table.status === 'CLOSED' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingTable(table);
                          setTableName(table.name);
                          setShowTableModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTable(table.id)}
                        className="p-2 text-gray-400 hover:text-wine-500 hover:bg-dark-700 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {table.status === 'OPEN' && (
                  <div className="mb-4 p-3 bg-dark-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Total:</span>
                      <span className="text-xl font-bold text-fire-500">
                        {formatCurrency(Number(table.totalAmount))}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {table.status === 'CLOSED' ? (
                    <button
                      onClick={() => handleOpenTable(table.id)}
                      className="btn-success flex-1"
                    >
                      <Check size={16} />
                      Abrir
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleOpenOrderModal(table)}
                        className="btn-primary flex-1"
                      >
                        <Utensils size={16} />
                        Pedido
                      </button>
                      <button
                        onClick={() => handleCloseTable(table.id)}
                        className="btn-secondary px-3"
                      >
                        <DollarSign size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table Modal */}
        {showTableModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="card w-full max-w-md animate-fadeIn">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {editingTable ? 'Editar Mesa' : 'Nova Mesa'}
                </h2>
                <button
                  onClick={() => setShowTableModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <form
                onSubmit={editingTable ? handleUpdateTable : handleCreateTable}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Nome da Mesa *
                  </label>
                  <input
                    type="text"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    placeholder="Ex: Mesa 01"
                    required
                    className="w-full"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTableModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editingTable ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Order Modal */}
        {showOrderModal && selectedTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="card w-full max-w-2xl max-h-[90vh] overflow-auto animate-fadeIn">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  Novo Pedido - {selectedTable.name}
                </h2>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Products List */}
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">
                    Produtos
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {products.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => addOrderItem(product.id)}
                        className="w-full flex items-center justify-between p-3 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors text-left"
                      >
                        <div>
                          <p className="font-medium text-white">{product.name}</p>
                          <p className="text-sm text-fire-500">
                            {formatCurrency(Number(product.price))}
                          </p>
                        </div>
                        <Plus size={20} className="text-fire-500" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">
                    Itens do Pedido
                  </h3>
                  {orderItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Selecione os produtos
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {orderItems.map((item) => (
                        <div
                          key={item.productId}
                          className="flex items-center justify-between p-3 bg-dark-700 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-white">
                              {getProductName(item.productId)}
                            </p>
                            <p className="text-sm text-gray-400">
                              {formatCurrency(Number(getProductPrice(item.productId)))}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateQuantity(item.productId, item.quantity - 1)
                              }
                              className="w-8 h-8 bg-dark-600 hover:bg-dark-500 rounded flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() =>
                                updateQuantity(item.productId, item.quantity + 1)
                              }
                              className="w-8 h-8 bg-dark-600 hover:bg-dark-500 rounded flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}

                      <div className="pt-4 border-t border-dark-600">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-lg font-semibold">Total:</span>
                          <span className="text-2xl font-bold text-fire-500">
                            {formatCurrency(getOrderTotal())}
                          </span>
                        </div>

                        <button
                          onClick={handleCreateOrder}
                          className="btn-primary w-full"
                        >
                          Confirmar Pedido
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
