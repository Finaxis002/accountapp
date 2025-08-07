
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, IndianRupee, Building, Loader2 } from 'lucide-react';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { ExpenseChart } from '@/components/dashboard/expense-chart';
import type { Client, Company } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

interface DashboardTabProps {
    selectedClient: Client;
}

export function DashboardTab({ selectedClient }: DashboardTabProps) {
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
    const [stats, setStats] = React.useState({ totalSales: 0, totalPurchases: 0 });
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();

    React.useEffect(() => {
        async function fetchStats() {
            if (!selectedClient._id) return;
            setIsLoading(true);
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("Authentication token not found.");
                
                // TODO: In a real app, these would be dedicated aggregation endpoints for performance.
                const salesRes = await fetch(`${baseURL}/api/sales/by-client/${selectedClient._id}`, { headers: { Authorization: `Bearer ${token}` } });
                const purchasesRes = await fetch(`${baseURL}/api/purchase/by-client/${selectedClient._id}`, { headers: { Authorization: `Bearer ${token}` } });

                const salesData = await salesRes.json();
                const purchasesData = await purchasesRes.json();

                const totalSales = (salesData.entries || []).reduce((acc: number, item: any) => acc + item.amount, 0);
                const totalPurchases = (purchasesData || []).reduce((acc: number, item: any) => acc + item.amount, 0);

                setStats({ totalSales, totalPurchases });

            } catch (error) {
                toast({ variant: "destructive", title: "Failed to load stats", description: "Could not fetch client's financial summary." });
            } finally {
                setIsLoading(false);
            }
        }
        fetchStats();
    }, [selectedClient, toast]);

    const kpiData = [
        { title: 'Total Sales', value: formatCurrency(stats.totalSales || 0), icon: IndianRupee },
        { title: 'Total Purchases', value: formatCurrency(stats.totalPurchases || 0), icon: IndianRupee },
        { title: 'Company Users', value: (selectedClient.users || 0).toString(), icon: Users },
        { title: 'Companies', value: (selectedClient.companies || 0).toString(), icon: Building },
    ];

    if (isLoading) {
        return (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({length: 4}).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                             <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                             <div className="h-6 w-6 bg-muted rounded-md animate-pulse" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 w-1/2 bg-muted rounded animate-pulse" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }


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
                         <CardDescription>A visual representation of sales vs purchases.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <RevenueChart totalRevenue={stats.totalSales}/>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Expense Breakdown</CardTitle>
                        <CardDescription>A breakdown of purchase categories.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ExpenseChart totalExpenses={stats.totalPurchases} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
