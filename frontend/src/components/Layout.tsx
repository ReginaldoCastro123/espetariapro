'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import {
  LayoutDashboard,
  Utensils,
  Table,
  ClipboardList,
  Users,
  CreditCard,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  Flame,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: true },
  { href: '/produtos', label: 'Produtos', icon: Utensils },
  { href: '/mesas', label: 'Mesas', icon: Table },
  { href: '/pedidos', label: 'Pedidos', icon: ClipboardList },
  { href: '/usuarios', label: 'Usuários', icon: Users, adminOnly: true },
  { href: '/assinatura', label: 'Assinatura', icon: CreditCard, adminOnly: true },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { isExpired } = useSubscription();

  // Proteção de rotas baseada em estado
  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/login' && pathname !== '/registro') {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  // Páginas públicas não precisam do layout lateral
  if (pathname === '/login' || pathname === '/registro') {
    return <>{children}</>;
  }

  // Tela de transição
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm animate-pulse">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {isExpired && (
        <div className="bg-red-600 text-white px-4 py-3 text-center sticky top-0 z-[60]">
          <div className="flex items-center justify-center gap-2">
            <AlertTriangle size={20} />
            <span className="font-medium">Sua assinatura expirou. <Link href="/assinatura" className="underline font-bold">Renove agora</Link></span>
          </div>
        </div>
      )}

      {/* Container Pai: Trava a rolagem global */}
      <div className="flex h-screen overflow-hidden">
        
        {/* Sidebar fixa */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark-800 border-r border-dark-700 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          
          <div className="flex items-center justify-between h-16 px-6 border-b border-dark-700 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Flame size={18} className="text-orange-500" />
              <span className="text-xl font-bold">EspetariaPro</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400"><X size={24} /></button>
          </div>

          {/* Navegação */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              if (item.adminOnly && !isAdmin) return null;
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-dark-700'}`}>
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          
          {/* Botão Sair */}
          <div className="p-4 border-t border-dark-700 shrink-0">
             <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors">
               <LogOut size={20} /> Sair
             </button>
          </div>
        </aside>

        {/* Conteúdo Principal: Rolagem própria aqui */}
        <div className="flex-1 flex flex-col h-screen overflow-y-auto">
          <header className="h-16 bg-dark-800 border-b border-dark-700 flex items-center px-4 lg:px-8 shrink-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-4"><Menu size={24} /></button>
            <h1 className="text-xl font-semibold">{navItems.find(i => i.href === pathname)?.label || 'EspetariaPro'}</h1>
          </header>
          <main className="p-4 lg:p-8 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}