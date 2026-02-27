import api from './api';
import { Table } from '@/types';

export const tableService = {
  async list(status?: string): Promise<Table[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    
    const response = await api.get(`/tables?${params.toString()}`);
    return response.data;
  },

  async get(id: string): Promise<Table> {
    const response = await api.get(`/tables/${id}`);
    return response.data;
  },

  async create(name: string): Promise<Table> {
    const response = await api.post('/tables', { name });
    return response.data;
  },

  async update(id: string, name: string): Promise<Table> {
    const response = await api.put(`/tables/${id}`, { name });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/tables/${id}`);
  },

  async open(id: string): Promise<Table> {
    const response = await api.post(`/tables/${id}/open`);
    return response.data;
  },

  async close(id: string, paymentMethod?: string): Promise<Table> {
    const response = await api.post(`/tables/${id}/close`, { paymentMethod });
    return response.data;
  },
};
