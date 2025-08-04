
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, IndianRupee, TrendingUp, Building, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { ExpenseChart } from '@/components/dashboard/expense-chart';
import type { Client, Company } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);

interface DashboardTabProps {
    selectedClient: Client;
}

export function DashboardTab({ selectedClient }: DashboardTabProps) {
    const [companies, setCompanies] = React.useState<Company[]>([]);
    const { toast } = useToast();

    React.useEffect(() => {
        async function fetchCompanies(clientId: string) {
          if (!clientId) return;
          try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token not found.");
            const res = await fetch(`http://localhost:5000/api/companies/by-client/${clientId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch companies for the selected client.");
            const data = await res.json();
            setCompanies(data);
          } catch (error) {
            toast({ variant: "destructive", title: "Failed to load companies", description: error instanceof Error ? error.message : "Something went wrong." });
          }
        }
        fetchCompanies(selectedClient._id);
      }, [selectedClient, toast]);

    const kpiData = selectedClient ? [
        { title: 'Total Sales', value: formatCurrency(selectedClient.totalSales || 0), icon: ArrowUpCircle },
        { title: 'Total Purchases', value: formatCurrency(selectedClient.totalPurchases || 0), icon: ArrowDownCircle },
        { title: 'Total Companies', value: (companies.length || 0).toString(), icon: Building },
        { title: 'Total Users', value: (selectedClient.users || 0).toString(), icon: Users },
    ] : [];

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {kpiData.map(kpi => (
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Revenue vs. Expenses</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2"><RevenueChart /></CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Expense Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent><ExpenseChart /></CardContent>
                </Card>
            </div>
        </div>
    )
}
