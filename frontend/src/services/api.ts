import axios from 'axios';

const api = axios.create({
  // Se a variável não estiver definida, usa localhost para desenvolvimento local
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ... (interceptors.request permanece igual) ...

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // ... (lógica de 403 permanece igual) ...

    const isAuthRoute = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      try {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
        
        if (!refreshToken) throw new Error('No refresh token');

        // MUDANÇA AQUI: Use a variável também no refresh-token
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';
        const response = await axios.post(`${baseUrl}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        if (typeof window !== 'undefined') localStorage.setItem('accessToken', accessToken);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // ... (lógica de erro permanece igual) ...
      }
    }
    return Promise.reject(error);
  }
);

export default api;