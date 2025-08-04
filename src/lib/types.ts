import type { LucideIcon } from "lucide-react";

export type Transaction = {
  _id: string;
  date: Date;
  party: { _id: string; name: string } | string;
  description: string;
  amount: number;
  type: "sales" | "purchases" | "income" | "expense";
  category?: string;
  product?: { _id: string; name: string };
  company?: { _id: string; companyName: string };
  invoiceNumber?: string;
  gstPercentage?: number;
};

export type Kpi = {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
  icon: LucideIcon;
};

export type User = {
  _id: string;
  userName: string;
  userId: string;
  contactNumber: string;
  address: string;
  password?: string;
  name?: string; // For compatibility
  username?: string; // For compatibility
  email?: string;
  avatar?: string;
  initials?: string;
  role?: "master" | "customer" | "Manager" | "Accountant" | "Viewer";
  token?: string;
  status?: "Active" | "Inactive";
  companies?: string[];
};
export type Client = {
  _id: string;
  clientUsername: string;
  contactName: string;
  email: string;
  phone: string;
  role: string;
  createdAt?: string;
  companyName?: string;
  subscriptionPlan?: "Premium" | "Standard" | "Basic";
  status?: "Active" | "Inactive";
  revenue?: number;
  users?: number;
  companies?: number;
  totalSales?: number;
  totalPurchases?: number;
  maxCompanies?: number;
  maxUsers?: number;
  canSendInvoiceEmail?: boolean;
  canSendInvoiceWhatsapp?: boolean;
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
  status: "Paid" | "Pending" | "Overdue";
};

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

export type Company = {
  _id: string;
  name: string;
  businessType: string;
  registrationNumber: string;
  address: string;
  companyOwner: string;
  contactNumber: string;
  gstin: string;
  companyType: string;
  companyName: string;
  client: string | Client;
  selectedClient?: string | Client;
};

export type Party = {
  [x: string]: unknown;
  _id: string;
  name: string;
  type: "party" | "vendor";
  createdByClient: string;
  email?: string;
  contactNumber?: string;
  address?: string;
};

export type Vendor = Party & {
  vendorName: string;
  city?: string;
  state?: string;
  gstin?: string;
  gstRegistrationType?:
    | "Regular"
    | "Composition"
    | "Unregistered"
    | "Consumer"
    | "Overseas"
    | "Special Economic Zone"
    | "Unknown";
  pan?: string;
  isTDSApplicable?: boolean;
};

export type Product = {
  _id: string;
  name: string;
  createdByClient: string;
};
