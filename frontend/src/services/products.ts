import api from './api';
import { Product } from '@/types';

export const productService = {
  async list(category?: string, active?: boolean): Promise<Product[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (active !== undefined) params.append('active', String(active));
    
    const response = await api.get(`/products?${params.toString()}`);
    return response.data;
  },

  async get(id: string): Promise<Product> {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  async create(data: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const response = await api.post('/products', data);
    return response.data;
  },

  async update(id: string, data: Partial<Product>): Promise<Product> {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },

  async getCategories(): Promise<string[]> {
    const response = await api.get('/products/categories');
    return response.data;
  },
};
