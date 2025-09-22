import type { LucideIcon } from "lucide-react";

export type Product = {
  _id: string;
  name: string;
  type?: 'product' | 'service';
  stocks?: number;
  unit?: string;
  createdByClient: string;   // <-- required
  createdAt?: string;
  updatedAt?: string;
  stock?: string;
  maxInventories?: number;
};


export type Service = {
    _id: string;
    serviceName:string;
    createdByClient: string;
    createdAt?: string;
    updatedAt?: string;
}


export type Item = {
  itemType: 'product' | 'service';
  // Product fields
  product?: Product;
  name?:string;
  quantity?: number;
  unitType?: "Kg" | "Litre" | "Piece" | "Box" | "Meter" | "Dozen" | "Pack" | "Other";
  pricePerUnit?: number;
  // Service fields
  service?: Service;
  serviceName?: Service;
  description?: string;
  // Common field
  amount: number;
}

export type Transaction = {
   _id: string;
   invoiceNumber?: string | null;
   invoiceYearYY?: number | null;
   date: Date;
   party?: {
     email: boolean; _id: string; name: string
   } | string;
   vendor?: { _id: string; vendorName: string } | string;
   description?: string;
    amount: number; // Fallback for old transactions, new ones use totalAmount
   totalAmount?: number;
   items?: any[];
   quantity?: number;
   pricePerUnit?: number;
   type: "sales" | "purchases" | "receipt" | "payment" | "journal";
   unitType?:
     | "Kg"
     | "Litre"
     | "Piece"
     | "Box"
     | "Meter"
     | "Dozen"
     | "Pack"
     | "Other";

   category?: string;
   product?: Product;
   company?: {
     businessName: any; _id: string; companyName: string
   };
   voucher?: string;
   // For Journal Entries
   debitAccount?: string;
   creditAccount?: string;
   narration?: string;
   // For Receipts/Payments
   referenceNumber?: string;
   notes?: string;
 };

export type Kpi = {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
  icon: LucideIcon;
};

export type User = {
  _id?: string;
  userName?: string;
  userId?: string;
  contactNumber?: string;
  address?: string;
  password?: string;
  name?: string; // For compatibility
  username?: string; // For compatibility
  email?: string;
  avatar?: string;
  initials?: string;
  role?: "master" | "customer" | "Manager" | "Accountant" | "Viewer" |  "admin" | "manager" | "user";
  token?: string;
  status?: "Active" | "Inactive";
  companies?: string[];
  clientUsername?: string;
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
    maxInventories?: number;
  canSendInvoiceEmail?: boolean;
  canSendInvoiceWhatsapp?: boolean;
  canCreateUsers?: boolean;
  canCreateProducts?: boolean;
   canCreateCustomers?: boolean;
  canCreateVendors?: boolean;
   canCreateCompanies?: boolean;  // Added
  canUpdateCompanies?: boolean;    // Added
  slug?:string;
};


export type ClientPermissions = {
  canCreateUsers?: boolean;
  canCreateProducts?: boolean;
  canCreateCustomers?: boolean;
  canCreateVendors?: boolean;
  canCreateCompanies?: boolean;
  canUpdateCompanies?: boolean;
  canSendInvoiceEmail?: boolean;
  canSendInvoiceWhatsapp?: boolean;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  companyName: string;
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
  registrationNumber: string;
  businessName: string;
  businessType: string;
  address: string;
  City?: string;
  addressState?: string;
  Country?: string;
  Pincode?: string;
  Telephone?: string;
  mobileNumber: string;
  emailId?: string;
  Website?: string;
  PANNumber?: string;
  IncomeTaxLoginPassword?: string;
  gstin?: string;
  gstState?: string;
  RegistrationType?: string;
  PeriodicityofGSTReturns?: string;
  GSTUsername?: string;
  GSTPassword?: string;
  ewayBillApplicable?: boolean;
  EWBBillUsername?: string;
  EWBBillPassword?: string;
  TANNumber?: string;
  TAXDeductionCollectionAcc?: string;
  DeductorType?: string;
  TDSLoginUsername?: string;
  TDSLoginPassword?: string;
  client?: Client | string;
  selectedClient?: Client | string;
  // Deprecated fields - use new fields above
  companyName?: string;
  companyType?: string;
  companyOwner?: string;
  contactNumber?: string;
  logo?:string;
};

export type Party = {
  _id: string;
  name: string;
  type: "party" | "vendor";
  createdByClient: string;
  email?: string;
  contactNumber?: string;
  address?: string;
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
  tdsRate?: number;
  tdsSection?: string;
  vendorName?: string; // For vendor compatibility
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
