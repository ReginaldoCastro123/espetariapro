import api from './api';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: any;
  company: any;
  subscription: any;
}

export const authService = {
  async login(credentials: any): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async register(data: any): Promise<AuthResponse> {
    // Pegamos tudo que vem da tela e garantimos que o adminName seja enviado
    const payloadParaBackend = {
      companyName: data.companyName,
      adminName: data.adminName || data.name, // Garante que não vá vazio!
      email: data.email,
      password: data.password,
      phone: data.phone
    };
    
    const response = await api.post('/auth/register', payloadParaBackend);
    return response.data;
  },

  logout() {
    // A limpeza de tokens já é feita no AuthContext
  }
};