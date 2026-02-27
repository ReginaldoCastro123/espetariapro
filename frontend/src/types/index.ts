export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'WAITER';
}

export interface Company {
  id: string;
  name: string;
  email: string;
}

export interface Subscription {
  plan: 'FREE' | 'ENTERPRISE';
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED';
  endDate: string | null;
  daysRemaining: number | null;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  active: boolean;
  createdAt: string;
}

export interface Table {
  id: string;
  name: string;
  status: 'OPEN' | 'CLOSED';
  totalAmount: number;
  orders?: Order[];
}

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  tableId: string;
  table: Table;
  waiterId: string;
  waiter: User;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  paymentMethod: string | null;
  totalAmount: number;
  orderItems: OrderItem[];
  createdAt: string;
  closedAt: string | null;
}

export interface DashboardStats {
  todaySales: number;
  monthSales: number;
  openTables: number;
  topProduct: {
    id: string;
    name: string;
    category: string;
    totalSold: number;
  } | null;
  topPaymentMethod: string | null;
  salesByDay: {
    date: string;
    dayName: string;
    total: number;
    orders: number;
  }[];
  topProducts: {
    id: string;
    name: string;
    category: string;
    totalSold: number;
  }[];
  salesByPayment: {
    method: string;
    total: number;
    count: number;
  }[];
  subscription: Subscription | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  companyName: string;
  email: string;
  password: string;
  adminName: string;
  phone?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'WAITER';
  active?: boolean; // Adicione esta linha aqui
}