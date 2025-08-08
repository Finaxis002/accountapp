
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCompany } from '@/contexts/company-context';
import { IndianRupee, CreditCard, Users, Building, Loader2, PlusCircle, Settings, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import type { Transaction, Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TransactionForm } from '@/components/transactions/transaction-form';
import { ProductStock } from '@/components/dashboard/product-stock';
import Link from 'next/link';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

export default function DashboardPage() {
  const { selectedCompanyId } = useCompany();
  const [companyData, setCompanyData] = React.useState<any>(null);
  const [recentTransactions, setRecentTransactions] = React.useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  const [isTransactionFormOpen, setIsTransactionFormOpen] = React.useState(false);


  const fetchCompanyDashboard = React.useCallback(async () => {
    if (!selectedCompanyId) {
      setIsLoading(false);
      setCompanyData(null);
      setRecentTransactions([]);
      return;
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Authentication token not found.");
      
      const buildRequest = (url: string) => fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      
      const [salesRes, purchasesRes, receiptsRes, paymentsRes, journalsRes, usersRes] = await Promise.all([
          buildRequest(`http://localhost:5000/api/sales?companyId=${selectedCompanyId}`),
          buildRequest(`http://localhost:5000/api/purchase?companyId=${selectedCompanyId}`),
          buildRequest(`http://localhost:5000/api/receipts?companyId=${selectedCompanyId}`),
          buildRequest(`http://localhost:5000/api/payments?companyId=${selectedCompanyId}`),
          buildRequest(`http://localhost:5000/api/journals?companyId=${selectedCompanyId}`),
          buildRequest(`http://localhost:5000/api/users`), // Assuming this fetches users for the client
      ]);

      const salesData = await salesRes.json();
      const purchasesData = await purchasesRes.json();
      const receiptsData = await receiptsRes.json();
      const paymentsData = await paymentsRes.json();
      const journalsData = await journalsRes.json();
      const usersData = await usersRes.json();

      const allTransactions = [
        ...(salesData.entries?.map((s: any) => ({ ...s, type: 'sales' })) || []),
        ...(purchasesData?.map((p: any) => ({ ...p, type: 'purchases' })) || []),
        ...(receiptsData?.map((r: any) => ({ ...r, type: 'receipt' })) || []),
        ...(paymentsData?.map((p: any) => ({ ...p, type: 'payment' })) || []),
        ...(journalsData?.map((j: any) => ({ ...j, description: j.narration, type: 'journal' })) || [])
      ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setRecentTransactions(allTransactions.slice(0, 5));

      const totalSales = (salesData.entries || []).reduce((acc: number, curr: any) => acc + curr.amount, 0);
      const totalPurchases = (purchasesData || []).reduce((acc: number, curr: any) => acc + curr.amount, 0);

      setCompanyData({
        totalSales,
        totalPurchases,
        users: usersData.length || 0,
      });

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load dashboard data",
        description: error instanceof Error ? error.message : "Something went wrong."
      });
      setCompanyData(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompanyId, toast]);

  React.useEffect(() => {
    fetchCompanyDashboard();
  }, [selectedCompanyId, fetchCompanyDashboard]);

  const handleTransactionFormSubmit = () => {
    setIsTransactionFormOpen(false);
    fetchCompanyDashboard();
  };

  const kpiData = [
    { title: 'Total Sales', value: formatCurrency(companyData?.totalSales || 0), icon: IndianRupee },
    { title: 'Total Purchases', value: formatCurrency(companyData?.totalPurchases || 0), icon: CreditCard },
    { title: 'Active Users', value: (companyData?.users || 0).toString(), icon: Users },
    { title: 'Companies', value: '1', icon: Building }, // Since one is selected
  ];

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                    An overview of your selected company's performance.
                </p>
            </div>
            {selectedCompanyId && (
              <div className="flex items-center gap-2">
                <Button variant="outline" asChild>
                  <Link href="/profile">
                    <Settings className="mr-2 h-4 w-4" /> Go to Settings
                  </Link>
                </Button>
                <Dialog open={isTransactionFormOpen} onOpenChange={setIsTransactionFormOpen}>
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
                    <TransactionForm onFormSubmit={handleTransactionFormSubmit} />
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
       ) : !selectedCompanyId ? (
          <Card className="flex flex-col items-center justify-center p-12 border-dashed">
            <Building className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Company Selected</h3>
            <p className="mt-1 text-sm text-muted-foreground">Please select a company from the header to view its dashboard.</p>
          </Card>
       ) : (
        <>
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-4">
            {kpiData.map((kpi) => (
              <Card key={kpi.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                  <kpi.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
           <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
              <ProductStock />
              <RecentTransactions transactions={recentTransactions} />
           </div>
        </>
      )}
    </div>
  );
}
