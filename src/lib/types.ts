import type { LucideIcon } from "lucide-react";

export type Transaction = {
  id: string;
  date: Date;
  party: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
};

export type Kpi = {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: LucideIcon;
};

export type User = {
  name: string;
  email: string;
  avatar: string;
  initials: string;
  role: 'admin' | 'customer';
};

export type Client = {
    id: string;
    companyName: string;
    contactName: string;
    email: string;
    subscriptionPlan: 'Premium' | 'Standard' | 'Basic';
    status: 'Active' | 'Inactive';
    revenue: number;
    joinedDate: Date;
    phone: string;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  invoiceDate: Date;
  dueDate: Date;
  items: {
    description: string;
    amount: number;
  }[];
  status: 'Paid' | 'Pending' | 'Overdue';
}

export type ProfitLossStatement = {
  revenue: { name: string; amount: number }[];
  totalRevenue: number;
  expenses: { name: string; amount: number }[];
  totalExpenses: number;
  netIncome: number;
};

export type BalanceSheet = {
  assets: {
    current: { name: string; amount: number }[];
    nonCurrent: { name: string; amount: number }[];
    total: number;
  };
  liabilities: {
    current: { name: string; amount: number }[];
    nonCurrent: { name: string; amount: number }[];
    total: number;
  };
  equity: {
    retainedEarnings: number;
    total: number;
  };
};
