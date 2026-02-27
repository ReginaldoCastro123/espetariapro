import api from './api';
import { Order } from '@/types';

export interface CreateOrderData {
  tableId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}

export const orderService = {
  async list(status?: string, startDate?: string, endDate?: string): Promise<Order[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/orders?${params.toString()}`);
    return response.data;
  },

  async get(id: string): Promise<Order> {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  async create(data: CreateOrderData): Promise<Order> {
    const response = await api.post('/orders', data);
    return response.data;
  },

  async addItems(orderId: string, items: CreateOrderData['items']): Promise<Order> {
    const response = await api.post(`/orders/${orderId}/items`, { items });
    return response.data;
  },

  async close(id: string, paymentMethod?: string): Promise<Order> {
    const response = await api.post(`/orders/${id}/close`, { paymentMethod });
    return response.data;
  },

  async cancel(id: string): Promise<Order> {
    const response = await api.post(`/orders/${id}/cancel`);
    return response.data;
  },
};
