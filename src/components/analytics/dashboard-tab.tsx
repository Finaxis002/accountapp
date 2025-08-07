
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, IndianRupee, Building, Loader2, Mail, Phone, User } from 'lucide-react';
import type { Client, Company } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { CompanyCard } from '../companies/company-card';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

interface DashboardTabProps {
    selectedClient: Client;
}

export function DashboardTab({ selectedClient }: DashboardTabProps) {
    const [stats, setStats] = React.useState({ totalSales: 0, totalPurchases: 0 });
    const [companies, setCompanies] = React.useState<Company[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();

    React.useEffect(() => {
        async function fetchStatsAndCompanies() {
            if (!selectedClient._id) return;
            setIsLoading(true);
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("Authentication token not found.");
                
                const buildRequest = (url: string) => fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                
                const [salesRes, purchasesRes, companiesRes] = await Promise.all([
                    buildRequest(`http://localhost:5000/api/sales/by-client/${selectedClient._id}`),
                    buildRequest(`http://localhost:5000/api/purchase/by-client/${selectedClient._id}`),
                    buildRequest(`http://localhost:5000/api/companies/by-client/${selectedClient._id}`),
                ]);

                const salesData = await salesRes.json();
                const purchasesData = await purchasesRes.json();
                const companiesData = await companiesRes.json();

                const totalSales = (salesData.entries || []).reduce((acc: number, item: any) => acc + item.amount, 0);
                const totalPurchases = (purchasesData || []).reduce((acc: number, item: any) => acc + item.amount, 0);
                
                setStats({ totalSales, totalPurchases });
                setCompanies(Array.isArray(companiesData) ? companiesData : []);

            } catch (error) {
                toast({ variant: "destructive", title: "Failed to load data", description: "Could not fetch client's financial summary." });
            } finally {
                setIsLoading(false);
            }
        }
        fetchStatsAndCompanies();
    }, [selectedClient, toast]);

    const kpiData = [
        { title: 'Total Sales', value: formatCurrency(stats.totalSales || 0), icon: IndianRupee },
        { title: 'Total Purchases', value: formatCurrency(stats.totalPurchases || 0), icon: IndianRupee },
        { title: 'Company Users', value: (selectedClient.users || 0).toString(), icon: Users },
        { title: 'Companies', value: (companies.length || 0).toString(), icon: Building },
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
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Client Details</CardTitle>
                        <CardDescription>Primary contact information for {selectedClient.contactName}.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <span>{selectedClient.contactName}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <a href={`mailto:${selectedClient.email}`} className="hover:underline">{selectedClient.email}</a>
                        </div>
                         <div className="flex items-center gap-4">
                            <Phone className="h-5 w-5 text-muted-foreground" />
                            <span>{selectedClient.phone}</span>
                        </div>
                    </CardContent>
                </Card>
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Associated Companies</CardTitle>
                            <CardDescription>A list of companies managed by this client.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {companies.length > 0 ? (
                                <Carousel opts={{ align: "start", loop: false }}>
                                    <CarouselContent className="-ml-4">
                                        {companies.map(company => (
                                            <CarouselItem key={company._id} className="pl-4 md:basis-1/2 lg:basis-full">
                                                <div className="p-1">
                                                     <CompanyCard company={company} onDelete={() => {}} />
                                                </div>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    <CarouselPrevious className="-left-4" />
                                    <CarouselNext className="-right-4" />
                                </Carousel>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-12 border-dashed rounded-lg text-center">
                                    <Building className="h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-4 text-lg font-semibold">No Companies Found</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">This client has not been assigned any companies.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
