import api from './api';

export interface SubscriptionData {
  id: string;
  plan: 'FREE' | 'ENTERPRISE';
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED';
  endDate: string | null;
  tableCount: number;
  userCount: number;
  isExpired: boolean;
  limits: {
    maxTables: number | null;
    maxUsers: number | null;
    historyDays: number | null;
  };
  price: number;
}

// Interface para os dados do PIX
export interface PixSubscriptionData {
  name: string;
  whatsapp: string;
  document: string; // CPF ou CNPJ
}

export const subscriptionService = {
  async get(): Promise<SubscriptionData> {
    const response = await api.get('/subscriptions');
    return response.data;
  },

  // NOVO MÉTODO: Integração com o fluxo de pagamento PIX
  async createPixSubscription(data: PixSubscriptionData): Promise<{ pixCode: string; qrCodeBase64: string }> {
    const response = await api.post('/subscriptions/create-pix', data);
    return response.data;
  },

  async checkLimits(): Promise<{
    plan: 'FREE' | 'ENTERPRISE';
    status: string;
    limits: {
      tables: { current: number; open: number; max: number | null; hasReachedLimit: boolean; };
      users: { current: number; max: number | null; hasReachedLimit: boolean; };
    };
  }> {
    const response = await api.get('/subscriptions/limits');
    return response.data;
  },

  async upgradeToEnterprise(): Promise<{ message: string; subscription: SubscriptionData }> {
    const response = await api.post('/subscriptions/upgrade');
    return response.data;
  },

  async renew(): Promise<{ message: string; subscription: SubscriptionData }> {
    const response = await api.post('/subscriptions/renew');
    return response.data;
  },
};