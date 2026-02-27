import api from './api';
import { User } from '@/types';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'WAITER';
}

export const userService = {
  async list(): Promise<User[]> {
    const response = await api.get('/users');
    return response.data;
  },

  async create(data: CreateUserData): Promise<User> {
    const response = await api.post('/users', data);
    return response.data;
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async resetPassword(id: string, newPassword: string): Promise<void> {
    await api.post(`/users/${id}/reset-password`, { newPassword });
  },
};
