'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Company, Subscription } from '@/types';
import { authService } from '@/services/auth';

interface AuthContextData {
  user: User | null;
  company: Company | null;
  subscription: Subscription | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (emailOrData: any, passwordStr?: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (!token) {
          setIsLoading(false);
          return;
        }

        const data = await authService.getMe();
        setUser(data.user);
        setSubscription(data.subscription);
        
        const storedCompany = localStorage.getItem('company');
        if (storedCompany) setCompany(JSON.parse(storedCompany));
      } catch (error) {
        if (typeof window !== 'undefined') localStorage.clear();
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  // O TYPESCRIPT AGORA ESTÁ FELIZ! 
  // Recebe tanto um objeto {email, password} quanto os dois separados
  async function login(emailOrData: any, passwordStr?: string) {
    try {
      let credentials;
      
      // Se a tela mandou separado: login("email", "senha")
      if (typeof emailOrData === 'string' && passwordStr) {
        credentials = { email: emailOrData, password: passwordStr };
      } 
      // Se a tela mandou junto: login({ email: "email", password: "senha" })
      else {
        credentials = emailOrData;
      }

      const response = await authService.login(credentials);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('company', JSON.stringify(response.company));
      }
      
      setUser(response.user);
      setCompany(response.company);
      setSubscription(response.subscription);
      
      return true;
    } catch (error: any) {
      console.error("ERRO COMPLETO DO SERVIDOR:", error.response?.data);
      
      let msg = error.response?.data?.error;
      if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        msg = error.response.data.errors[0].msg;
      }
      
      throw new Error(msg || 'E-mail ou senha incorretos.');
    }
  }

  async function register(data: any) {
    try {
      const response = await authService.register(data);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('company', JSON.stringify(response.company));
      }
      
      setUser(response.user);
      setCompany(response.company);
      setSubscription(response.subscription);
      
      return true;
    } catch (error: any) {
      let msg = error.response?.data?.error;
      if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        msg = error.response.data.errors[0].msg;
      }
      throw new Error(msg || 'Erro ao cadastrar. Verifique os dados.');
    }
  }

  function logout() {
    if (typeof window !== 'undefined') localStorage.clear();
    setUser(null);
    setCompany(null);
    setSubscription(null);
    window.location.href = '/login';
  }

  return (
    <AuthContext.Provider value={{ user, company, subscription, isLoading, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);