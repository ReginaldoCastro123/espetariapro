import api from './api';
import { DashboardStats } from '@/types';

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  async getSalesByWaiter(startDate?: string, endDate?: string): Promise<{
    waiter: { id: string; name: string };
    totalSales: number;
    orderCount: number;
  }[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/dashboard/sales-by-waiter?${params.toString()}`);
    return response.data;
  },
};
