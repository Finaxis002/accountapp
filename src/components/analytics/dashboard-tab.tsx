
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, IndianRupee, Building, Mail, Phone, User, Loader2 } from 'lucide-react';
import type { Client, Company } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { CompanyCard } from '../companies/company-card';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

interface DashboardTabProps {
    selectedClient: Client;
    selectedCompanyId: string | null;
}

export function DashboardTab({ selectedClient, selectedCompanyId }: DashboardTabProps) {
     const baseURL = process.env. NEXT_PUBLIC_BASE_URL;
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
                
                let salesUrl, purchasesUrl;

                if (selectedCompanyId) {
                    salesUrl = `${baseURL}/api/sales?companyId=${selectedCompanyId}`;
                    purchasesUrl = `${baseURL}/api/purchase?companyId=${selectedCompanyId}`;
                } else {
                    salesUrl = `${baseURL}/api/sales/by-client/${selectedClient._id}`;
                    purchasesUrl = `${baseURL}/api/purchase/by-client/${selectedClient._id}`;
                }
                
                const [salesRes, purchasesRes, companiesRes] = await Promise.all([
                    buildRequest(salesUrl),
                    buildRequest(purchasesUrl),
                    buildRequest(`${baseURL}/api/companies/by-client/${selectedClient._id}`),
                ]);

                const salesData = await salesRes.json();
                const purchasesData = await purchasesRes.json();
                const companiesData = await companiesRes.json();

                const totalSales = (salesData.entries || salesData || []).reduce((acc: number, item: any) => acc + item.amount, 0);
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
    }, [selectedClient, selectedCompanyId, toast]);

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
                        <CardDescription>Primary contact information.</CardDescription>
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
                    {companies.length > 0 ? (
                        <Carousel
                            opts={{
                                align: "start",
                            }}
                            className="w-full"
                        >
                            <CarouselContent>
                                {companies.map((company) => (
                                    <CarouselItem key={company._id} className="md:basis-1/1 lg:basis-1/1">
                                        <div className="p-1">
                                            <CompanyCard company={company} onDelete={() => {}} />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className='sm:ml-4 ml-[40px]' />
                            <CarouselNext className='sm:mr-4 mr-[40px]'/>
                        </Carousel>
                    ) : (
                        <Card>
                             <CardHeader>
                                <CardTitle>No Companies Found</CardTitle>
                                <CardDescription>This client does not have any companies assigned yet.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center p-12">
                                <Building className="h-16 w-16 text-muted-foreground" />
                            </CardContent>
                        </Card>
                    )}
                </div>
               
            </div>
        </div>
    )
}
