import axios from 'axios';

const api = axios.create({
  // Se a variável não estiver definida, usa localhost para desenvolvimento local
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. O "ENTREGADOR DE CRACHÁ" (Faltava isso!)
// Antes de qualquer requisição sair do Front-end, ele injeta o Token
api.interceptors.request.use(
  (config) => {
    // O typeof window previne erros no Next.js (SSR)
    if (typeof window !== 'undefined') {
      // Verifica o nome exato que você salvou no login (geralmente é token ou accessToken)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 2. O RENOVADOR DE TOKEN (O que você já tinha, mas ajustado para não dar erro de tipagem)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Evita loop infinito se o erro 401 vier do próprio login
    const isAuthRoute = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/register');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      try {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
        
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';
        const response = await axios.post(`${baseUrl}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          // Opcional: se o seu login salva como 'token', atualize aqui também
          localStorage.setItem('token', accessToken); 
        }
        
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        
        return api(originalRequest);
      } catch (refreshError) {
        // Se falhar o refresh, desloga o usuário por segurança
        if (typeof window !== 'undefined') {
          localStorage.clear();
          window.location.href = '/login'; 
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;