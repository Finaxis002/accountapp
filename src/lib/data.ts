import type { User, Kpi, Transaction, Invoice, ProfitLossStatement, BalanceSheet, Client } from './types';
import { DollarSign, CreditCard, BarChart, ShoppingCart } from 'lucide-react';

export const kpiData: Kpi[] = [
  {
    title: 'Total Revenue',
    value: '$45,231.89',
    change: '+20.1% from last month',
    changeType: 'increase',
    icon: DollarSign,
  },
  {
    title: 'Total Expenses',
    value: '$21,120.50',
    change: '+15.2% from last month',
    changeType: 'increase',
    icon: CreditCard,
  },
  {
    title: 'Net Profit',
    value: '$24,111.39',
    change: '+25.0% from last month',
    changeType: 'increase',
    icon: BarChart,
  },
  {
    title: 'Open Invoices',
    value: '12',
    change: '-5 from last month',
    changeType: 'decrease',
    icon: ShoppingCart,
  },
];

export const transactions: Transaction[] = [
  { id: 'txn_1', date: new Date('2024-07-15'), party: 'Tech Solutions Inc.', description: 'Monthly software subscription', amount: 250.00, type: 'expense', category: 'Software' },
  { id: 'txn_2', date: new Date('2024-07-14'), party: 'Client Innovations LLC', description: 'Payment for project alpha', amount: 5000.00, type: 'income', category: 'Sales' },
  { id: 'txn_3', date: new Date('2024-07-13'), party: 'Office Supplies Co.', description: 'A4 paper and pens', amount: 75.50, type: 'expense', category: 'Office Supplies' },
  { id: 'txn_4', date: new Date('2024-07-12'), party: 'Utility Power', description: 'Electricity bill for July', amount: 120.00, type: 'expense', category: 'Utilities' },
  { id: 'txn_5', date: new Date('2024-07-11'), party: 'Creative Designs', description: 'Logo design services', amount: 1200.00, type: 'income', category: 'Sales' },
  { id: 'txn_6', date: new Date('2024-07-10'), party: 'Internet Provider', description: 'Monthly internet service', amount: 80.00, type: 'expense', category: 'Utilities' },
  { id: 'txn_7', date: new Date('2024-07-09'), party: 'Coffee Corner', description: 'Team coffee meeting', amount: 35.20, type: 'expense', category: 'Meals & Entertainment' },
  { id: 'txn_8', date: new Date('2024-07-08'), party: 'Big Box Retail', description: 'New office chair', amount: 350.00, type: 'expense', category: 'Furniture & Equipment' },
];

export const invoices: Invoice[] = [
  {
    id: 'inv_1',
    invoiceNumber: 'INV-2024-001',
    customerName: 'Client Innovations LLC',
    customerEmail: 'contact@clientinnovations.com',
    invoiceDate: new Date('2024-07-14'),
    dueDate: new Date('2024-08-13'),
    items: [{ description: 'Payment for project alpha', amount: 5000.00 }],
    status: 'Paid'
  },
  {
    id: 'inv_2',
    invoiceNumber: 'INV-2024-002',
    customerName: 'Creative Designs',
    customerEmail: 'hello@creativedesigns.com',
    invoiceDate: new Date('2024-07-11'),
    dueDate: new Date('2024-08-10'),
    items: [{ description: 'Logo design services', amount: 1200.00 }],
    status: 'Paid'
  },
  {
    id: 'inv_3',
    invoiceNumber: 'INV-2024-003',
    customerName: 'Data Systems Ltd.',
    customerEmail: 'info@datasystems.com',
    invoiceDate: new Date('2024-07-20'),
    dueDate: new Date('2024-08-19'),
    items: [{ description: 'Data analysis consultation', amount: 2500.00 }],
    status: 'Pending'
  }
];

export const plStatement: ProfitLossStatement = {
  revenue: [
    { name: 'Consulting Services', amount: 35000 },
    { name: 'Software Sales', amount: 15000 },
  ],
  totalRevenue: 50000,
  expenses: [
    { name: 'Salaries and Wages', amount: 18000 },
    { name: 'Marketing', amount: 5000 },
    { name: 'Rent', amount: 4000 },
    { name: 'Software', amount: 2000 },
    { name: 'Utilities', amount: 1000 },
  ],
  totalExpenses: 30000,
  netIncome: 20000,
};

export const balanceSheetData: BalanceSheet = {
  assets: {
    current: [
      { name: 'Cash', amount: 50000 },
      { name: 'Accounts Receivable', amount: 15000 },
    ],
    nonCurrent: [
      { name: 'Property, Plant, and Equipment', amount: 75000 },
    ],
    total: 140000
  },
  liabilities: {
    current: [
      { name: 'Accounts Payable', amount: 10000 },
    ],
    nonCurrent: [
      { name: 'Long-term Debt', amount: 40000 },
    ],
    total: 50000
  },
  equity: {
    retainedEarnings: 90000,
    total: 90000
  }
};

export const clients: Client[] = [
    {
        id: 'client_1',
        clientUsername: 'techcorp',
        companyName: 'TechCorp Solutions',
        contactName: 'TechCorp Client',
        email: 'admin@techcorp.com',
        subscriptionPlan: 'Premium',
        status: 'Active',
        revenue: 125000,
        joinedDate: new Date('2024-01-15'),
        phone: '+1 (555) 123-4567',
        users: 15,
        companies: 3,
    },
    {
        id: 'client_2',
        clientUsername: 'greenenergy',
        companyName: 'Green Energy Ltd',
        contactName: 'Customer User',
        email: 'contact@greenenergy.com',
        subscriptionPlan: 'Standard',
        status: 'Active',
        revenue: 89000,
        joinedDate: new Date('2024-02-20'),
        phone: '+1 (555) 987-6543',
        users: 8,
        companies: 1,
    },
    {
        id: 'client_3',
        clientUsername: 'fashioninc',
        companyName: 'Fashion Forward Inc',
        contactName: 'Alex Doe',
        email: 'hello@fashionforward.com',
        subscriptionPlan: 'Basic',
        status: 'Inactive',
        revenue: 45000,
        joinedDate: new Date('2024-03-10'),
        phone: '+1 (555) 456-7890',
        users: 3,
        companies: 1,
    },
];
