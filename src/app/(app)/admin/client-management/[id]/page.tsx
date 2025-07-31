
import { clients } from "@/lib/data";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Users, Building, DollarSign, TrendingUp, FileBarChart2, UserPlus, Settings } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { ExpenseChart } from "@/components/dashboard/expense-chart";
import { Separator } from "@/components/ui/separator";

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const client = clients.find(c => c.id === params.id);

  if (!client) {
    notFound();
  }

  const kpiData = [
      { title: 'Lifetime Revenue', value: formatCurrency(client.revenue), icon: DollarSign },
      { title: 'Net Profit', value: formatCurrency(client.revenue * 0.45), icon: TrendingUp }, // Dummy calculation
      { title: 'Active Users', value: client.users.toString(), icon: Users },
      { title: 'Companies', value: client.companies.toString(), icon: Building },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon">
                <Link href="/admin/client-management"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{client.companyName}</h2>
              <p className="text-muted-foreground">
                Comprehensive dashboard for {client.contactName}.
              </p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline">
              <UserPlus className="mr-2 h-4 w-4" /> Add User
            </Button>
            <Button>
              <Edit className="mr-2 h-4 w-4" /> Edit Client
            </Button>
        </div>
      </div>

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

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Revenue vs. Expenses</CardTitle>
                        <CardDescription>A summary of income and outcome over time.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <RevenueChart />
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Expense Breakdown</CardTitle>
                        <CardDescription>Spending by category for the current period.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ExpenseChart />
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
        <TabsContent value="financials" className="mt-6">
             <Card>
                <CardHeader>
                    <CardTitle>Financial Reports</CardTitle>
                    <CardDescription>Access detailed financial statements for {client.companyName}.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-4">
                            <FileBarChart2 className="h-6 w-6 text-primary" />
                            <div>
                                <h4 className="font-semibold">Profit & Loss Statement</h4>
                                <p className="text-sm text-muted-foreground">View the income statement.</p>
                            </div>
                        </div>
                        <Button variant="outline" asChild><Link href="/reports/profit-loss">View Report</Link></Button>
                    </div>
                     <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-4">
                           <FileBarChart2 className="h-6 w-6 text-primary" />
                            <div>
                                <h4 className="font-semibold">Balance Sheet</h4>
                                <p className="text-sm text-muted-foreground">View the statement of financial position.</p>
                            </div>
                        </div>
                        <Button variant="outline" asChild><Link href="/reports/balance-sheet">View Report</Link></Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="users" className="mt-6">
             <Card>
                <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage users associated with {client.companyName}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">User management interface will be displayed here.</p>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
             <Card>
                <CardHeader>
                    <CardTitle>Client Settings</CardTitle>
                    <CardDescription>Manage settings for {client.companyName}.</CardDescription>
                </CardHeader>
                <CardContent>
                     <p className="text-muted-foreground">Client-specific settings will be displayed here.</p>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
