export interface User {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  language: 'pt-BR' | 'en';
  notificationsEnabled: boolean;
  currency: string;
}

export interface BankAccount {
  id: string;
  userId: string;
  name: string;
  balance: number;
  type: 'checking' | 'savings' | 'digital';
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  bankAccountId: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  category: string;
  date: Date;
  paymentMethod?: 'cash' | 'credit' | 'debit' | 'pix' | 'transfer';
  cardId?: string;
  investmentId?: string;
  isRecurring?: boolean;
  recurringPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  budget?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Card {
  id: string;
  userId: string;
  name: string;
  type: 'credit' | 'debit';
  number: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'elo' | 'other';
  limit: number;
  currentBalance: number;
  availableLimit: number;
  closingDay: number;
  dueDay: number;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CardInstallment {
  id: string;
  userId: string;
  cardId: string;
  transactionId: string;
  description: string;
  totalAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  currentInstallment: number;
  dueDate: Date;
  isPaid: boolean;
  paidAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CardStatement {
  id: string;
  userId: string;
  cardId: string;
  month: number;
  year: number;
  totalAmount: number;
  paidAmount: number;
  isPaid: boolean;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Investment {
  id: string;
  userId: string;
  bankAccountId: string;
  name: string;
  type: 'stocks' | 'fiis' | 'crypto' | 'fixed_income' | 'treasury' | 'other';
  ticker?: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalInvested: number;
  currentValue: number;
  broker: string;
  purchaseDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvestmentTransaction {
  id: string;
  userId: string;
  investmentId: string;
  bankAccountId: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description?: string;
  amount: number;
  dueDate: Date;
  category: string;
  isRecurring: boolean;
  recurringPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  isCompleted: boolean;
  notificationEnabled: boolean;
  notificationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'transaction' | 'reminder' | 'system' | 'alert';
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: Date;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  period: 'monthly' | 'yearly';
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardData {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  monthlyIncome: number;
  monthlyExpense: number;
  recentTransactions: Transaction[];
  categoryBreakdown: { category: string; amount: number; color: string }[];
  monthlyTrend: { month: string; income: number; expense: number }[];
  investmentSummary: {
    totalInvested: number;
    currentValue: number;
    profitLoss: number;
    profitLossPercentage: number;
  };
  upcomingReminders: Reminder[];
  unreadNotifications: number;
}

export interface AIInsight {
  id: string;
  userId: string;
  type: 'tip' | 'warning' | 'goal' | 'analysis';
  title: string;
  description: string;
  action?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface AppState {
  isLoading: boolean;
  isOnline: boolean;
  user: User | null;
  settings: {
    theme: 'light' | 'dark' | 'system';
    currency: string;
    language: string;
    notifications: boolean;
  };
}
