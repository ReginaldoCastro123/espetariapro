'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { userService } from '@/services/users';
import { User } from '@/types';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  User as UserIcon,
  Shield,
  UserCircle,
  Key,
} from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'WAITER' as 'ADMIN' | 'WAITER',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await userService.list();
      setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenModal(user?: User) {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'WAITER',
      });
    }
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editingUser) {
        await userService.update(editingUser.id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        });
      } else {
        await userService.create({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });
      }

      setShowModal(false);
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar usuário');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      await userService.delete(id);
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao excluir usuário');
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      await userService.resetPassword(selectedUser.id, newPassword);
      setShowResetModal(false);
      setSelectedUser(null);
      setNewPassword('');
      alert('Senha redefinida com sucesso!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao redefinir senha');
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute adminOnly>
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
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10"
            />
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="btn-primary"
          >
            <Plus size={20} />
            Novo Usuário
          </button>
        </div>

        {/* Users List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fire-500"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="card text-center py-12">
            <UserIcon size={48} className="mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-dark-700 rounded-full flex items-center justify-center">
                      {user.role === 'ADMIN' ? (
                        <Shield size={24} className="text-fire-500" />
                      ) : (
                        <UserCircle size={24} className="text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{user.name}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          user.role === 'ADMIN'
                            ? 'bg-fire-500/20 text-fire-500'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {user.role === 'ADMIN' ? 'Administrador' : 'Garçom'}
                      </span>
                    </div>
                  </div>
                  {!user.active && (
                    <span className="px-2 py-1 bg-wine-500/20 text-wine-500 rounded text-xs">
                      Inativo
                    </span>
                  )}
                </div>

                <p className="text-gray-400 text-sm mb-4">{user.email}</p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(user)}
                    className="btn-secondary flex-1 py-2"
                  >
                    <Edit2 size={16} />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowResetModal(true);
                    }}
                    className="btn-secondary px-3"
                  >
                    <Key size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="btn-danger px-3"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* User Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="card w-full max-w-md animate-fadeIn">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    className="w-full"
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Senha *
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required={!editingUser}
                      minLength={6}
                      className="w-full"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Função *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as 'ADMIN' | 'WAITER',
                      })
                    }
                    className="w-full"
                  >
                    <option value="WAITER">Garçom</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editingUser ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {showResetModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="card w-full max-w-md animate-fadeIn">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Redefinir Senha</h2>
                <button
                  onClick={() => setShowResetModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <p className="text-gray-400 mb-4">
                Redefinir senha para <strong>{selectedUser.name}</strong>
              </p>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Nova Senha *
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    Redefinir
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
