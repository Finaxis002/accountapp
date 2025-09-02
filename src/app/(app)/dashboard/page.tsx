"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCompany } from "@/contexts/company-context";
import {
  IndianRupee,
  CreditCard,
  Users,
  Building,
  Loader2,
  PlusCircle,
  Settings,
  Package,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import type { Transaction, Product, Company } from "@/lib/types";
import { useUserPermissions } from "@/contexts/user-permissions-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { ProductStock } from "@/components/dashboard/product-stock";
import Link from "next/link";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    amount
  );

const toArray = (data: any) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.entries)) return data.entries;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const num = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// type-aware amount extractor
const getAmount = (
  type: "sales" | "purchases" | "receipt" | "payment" | "journal",
  row: any
) => {
  switch (type) {
    case "sales":
      // your sales rows usually have amount or totalAmount
      return num(row?.amount ?? row?.totalAmount);
    case "purchases":
      // purchases sample shows totalAmount
      return num(row?.totalAmount ?? row?.amount);
    case "receipt":
    case "payment":
      return num(row?.amount ?? row?.totalAmount);
    case "journal":
      // journals typically don't contribute to sales/purchases KPIs
      return 0;
    default:
      return 0;
  }
};

export default function DashboardPage() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const { selectedCompanyId } = useCompany();
  const [companyData, setCompanyData] = React.useState<any>(null);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [party, setParty] = React.useState<any>(null); // Set party data here
  const [company, setCompany] = React.useState<any>(null); // Set company data here
   const [transaction, setTransaction] = React.useState<any>(null); 

  const { permissions: userCaps } = useUserPermissions();
  const selectedCompany = React.useMemo(
    () =>
      selectedCompanyId
        ? companies.find((c) => c._id === selectedCompanyId) || null
        : null,
    [companies, selectedCompanyId]
  );

  const [recentTransactions, setRecentTransactions] = React.useState<
    Transaction[]
  >([]);
  const [serviceNameById, setServiceNameById] = React.useState<
    Map<string, string>
  >(new Map());
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  const [isTransactionFormOpen, setIsTransactionFormOpen] =
    React.useState(false);

  const fetchCompanyDashboard = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const buildRequest = (url: string) =>
        fetch(url, { headers: { Authorization: `Bearer ${token}` } });

      // when "All" is selected, omit companyId
      const queryParam = selectedCompanyId
        ? `?companyId=${selectedCompanyId}`
        : "";

      const [
        salesRes,
        purchasesRes,
        receiptsRes,
        paymentsRes,
        journalsRes,
        usersRes,
        companiesRes,
        servicesRes,
      ] = await Promise.all([
        buildRequest(`${baseURL}/api/sales${queryParam}`),
        buildRequest(`${baseURL}/api/purchase${queryParam}`),
        buildRequest(`${baseURL}/api/receipts${queryParam}`),
        buildRequest(`${baseURL}/api/payments${queryParam}`),
        buildRequest(`${baseURL}/api/journals${queryParam}`),
        buildRequest(`${baseURL}/api/users`),
        buildRequest(`${baseURL}/api/companies/my`),
        buildRequest(`${baseURL}/api/services`),
      ]);

      const rawSales = await salesRes.json();
      const rawPurchases = await purchasesRes.json();
      const rawReceipts = await receiptsRes.json();
      const rawPayments = await paymentsRes.json();
      const rawJournals = await journalsRes.json();
      const usersData = await usersRes.json();
      const companiesData = await companiesRes.json();

      const servicesJson = await servicesRes.json();

      const servicesArr = Array.isArray(servicesJson)
        ? servicesJson
        : servicesJson.services || [];
      const sMap = new Map<string, string>();
      for (const s of servicesArr) {
        if (s?._id)
          sMap.set(String(s._id), s.serviceName || s.name || "Service");
      }
      setServiceNameById(sMap);

      setCompanies(Array.isArray(companiesData) ? companiesData : []);

      // normalize to arrays regardless of shape
      const salesArr = toArray(rawSales);
      const purchasesArr = toArray(rawPurchases);
      const receiptsArr = toArray(rawReceipts);
      const paymentsArr = toArray(rawPayments);
      const journalsArr = toArray(rawJournals);

      // recent transactions (combined)
      const allTransactions = [
        ...salesArr.map((s: any) => ({ ...s, type: "sales" })),
        ...purchasesArr.map((p: any) => ({ ...p, type: "purchases" })),
        ...receiptsArr.map((r: any) => ({ ...r, type: "receipt" })),
        ...paymentsArr.map((p: any) => ({ ...p, type: "payment" })),
        ...journalsArr.map((j: any) => ({
          ...j,
          description: j?.narration ?? j?.description ?? "",
          type: "journal",
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setRecentTransactions(allTransactions.slice(0, 5));

      // KPI totals from normalized arrays
      const totalSales = salesArr.reduce(
        (acc: number, row: any) => acc + getAmount("sales", row),
        0
      );
      const totalPurchases = purchasesArr.reduce(
        (acc: number, row: any) => acc + getAmount("purchases", row),
        0
      );

      const companiesCount = selectedCompanyId ? 1 : companiesData?.length || 0;

      setCompanyData({
        totalSales,
        totalPurchases,
        users: usersData?.length || 0,
        companies: companiesCount,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load dashboard data",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
      setCompanyData(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompanyId, toast, baseURL]);

  React.useEffect(() => {
    fetchCompanyDashboard();
  }, [selectedCompanyId, fetchCompanyDashboard]);

  const handleTransactionFormSubmit = () => {
    setIsTransactionFormOpen(false);
    fetchCompanyDashboard();
  };

  const kpiData = [
    {
      title: "Total Sales",
      value: formatCurrency(companyData?.totalSales || 0),
      icon: IndianRupee,
      description: selectedCompanyId
        ? "For selected company"
        : "Across all companies",
    },
    {
      title: "Total Purchases",
      value: formatCurrency(companyData?.totalPurchases || 0),
      icon: CreditCard,
    },
    {
      title: "Active Users",
      value: (companyData?.users || 0).toString(),
      icon: Users,
    },
    {
      title: "Companies",
      value: (companyData?.companies || 0).toString(),
      icon: Building,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            {selectedCompany
              ? `An overview of ${selectedCompany.businessName}.`
              : "An overview across all companies."}
          </p>
        </div>
        {companies.length > 0 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/profile">
                <Settings className="mr-2 h-4 w-4" /> Go to Settings
              </Link>
            </Button>
            <Dialog
              open={isTransactionFormOpen}
              onOpenChange={setIsTransactionFormOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl grid-rows-[auto,1fr,auto] max-h-[90vh] p-0">
                <DialogHeader className="p-6">
                  <DialogTitle>Create a New Transaction</DialogTitle>
                  <DialogDescription>
                    Fill in the details below to record a new financial event.
                  </DialogDescription>
                </DialogHeader>
                <TransactionForm
                  onFormSubmit={handleTransactionFormSubmit}
                  serviceNameById={serviceNameById}
                  transaction={transaction}
                  party={party}
                  company={company}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                <div className="h-4 w-4 bg-muted rounded-full animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2 animate-pulse" />
                <div className="h-3 bg-muted rounded w-1/3 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : companies.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 border-dashed">
          <Building className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Company Selected</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Please select a company from the header to view its dashboard.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-4">
            {kpiData.map((kpi) => (
              <Card key={kpi.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {kpi.title}
                  </CardTitle>
                  <kpi.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {kpi.description}
                  </p>{" "}
                  {/* ✅ Add this line */}
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
            <ProductStock />
            <RecentTransactions
              transactions={recentTransactions}
              serviceNameById={serviceNameById}
            />
          </div>
        </>
      )}
    </div>
  );
}
