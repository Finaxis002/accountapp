"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Edit,
  Users,
  Building,
  DollarSign,
  TrendingUp,
  FileBarChart2,
  UserPlus,
  Settings,
  Loader2,
  User,
  Phone,
  Hash,
  FileText as FileTextIcon,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { ExpenseChart } from "@/components/dashboard/expense-chart";
import { notFound, useParams } from "next/navigation";
import type { Client, Company } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);

export default function ClientDetailPage() {
  const [client, setClient] = React.useState<Client | null>(null);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCompaniesLoading, setIsCompaniesLoading] = React.useState(true);
  const { toast } = useToast();
  const params = useParams();
  const id = params.id as string;

  React.useEffect(() => {
    async function getClient(clientId: string) {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const res = await fetch(
          `http://localhost:5000/api/clients/${clientId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        if (!res.ok) {
          if (res.status === 404) {
            return null;
          }
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch client");
        }

        const data = await res.json();
        setClient(data);
        return data;
      } catch (error) {
        console.error("Failed to fetch client:", error);
        if (
          error instanceof TypeError &&
          error.message.includes("fetch failed")
        ) {
          // This error happens on the server, we can't show a toast.
          // Let the notFound() handle it gracefully.
        } else {
          toast({
            variant: "destructive",
            title: "Failed to load client data",
            description:
              error instanceof Error ? error.message : "Something went wrong.",
          });
        }
        setClient(null);
        return null;
      } finally {
        setIsLoading(false);
      }
    }

    async function fetchCompanies(clientId: string) {
      setIsCompaniesLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");

        const res = await fetch(
          `http://localhost:5000/api/companies/by-client/${clientId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          if (res.status === 403) {
            throw new Error(
              "Access Denied: Please check server-side permissions and role names (e.g., 'master' vs 'masterAdmin')."
            );
          }
          throw new Error(
            errorData.message || "Failed to fetch companies for this client."
          );
        }
        const data = await res.json();
        setCompanies(data);
      } catch (error) {
        console.error("Failed to fetch companies:", error);
        toast({
          variant: "destructive",
          title: "Failed to load companies",
          description:
            error instanceof Error
              ? error.message
              : "An error occurred while fetching company data.",
        });
      } finally {
        setIsCompaniesLoading(false);
      }
    }

    if (id) {
      getClient(id).then((clientData) => {
        if (clientData) {
          fetchCompanies(id);
        }
      });
    }
  }, [id, toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!client) {
    return notFound();
  }

  const kpiData = [
    {
      title: "Lifetime Revenue",
      value: formatCurrency(client.revenue || 0),
      icon: DollarSign,
    },
    {
      title: "Net Profit",
      value: formatCurrency((client.revenue || 0) * 0.45),
      icon: TrendingUp,
    }, // Dummy calculation
    {
      title: "Active Users",
      value: (client.users || 0).toString(),
      icon: Users,
    },
    {
      title: "Companies",
      value: (client.companies || 0).toString(),
      icon: Building,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link href="/admin/client-management">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Managing: {client.companyName}
            </h2>
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

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Revenue vs. Expenses</CardTitle>
                <CardDescription>
                  A summary of income and outcome over time.
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <RevenueChart />
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>
                  Spending by category for the current period.
                </CardDescription>
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
              <CardDescription>
                Access detailed financial statements for {client.companyName}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-4">
                  <FileBarChart2 className="h-6 w-6 text-primary" />
                  <div>
                    <h4 className="font-semibold">Profit & Loss Statement</h4>
                    <p className="text-sm text-muted-foreground">
                      View the income statement.
                    </p>
                  </div>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/reports/profit-loss">View Report</Link>
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-4">
                  <FileBarChart2 className="h-6 w-6 text-primary" />
                  <div>
                    <h4 className="font-semibold">Balance Sheet</h4>
                    <p className="text-sm text-muted-foreground">
                      View the statement of financial position.
                    </p>
                  </div>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/reports/balance-sheet">View Report</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="companies" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Management</CardTitle>
              <CardDescription>
                Manage companies associated with {client.companyName}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isCompaniesLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : companies.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Owner & Contact</TableHead>
                      <TableHead>Registration No.</TableHead>
                      <TableHead>GSTIN</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company) => (
                      <TableRow key={company._id}>
                        <TableCell>
                          <div className="font-semibold">
                            {company.companyName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {company.companyType}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="bg-blue-500/10 text-blue-700 rounded-full p-1">
                              <User className="h-4 w-4" />
                            </div>
                            <span className="text-sm">
                              {company.companyOwner}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                             <div className="bg-yellow-500/10 text-yellow-700 rounded-full p-1">
                               <Phone className="h-4 w-4" />
                             </div>
                            <span className="text-sm">
                              {company.contactNumber}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 mb-1">
                            <Hash className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-mono bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                              {company.registrationNumber}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 mb-1">
                            <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-mono bg-green-500/10 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                              {company.gstin || "N/A"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No companies found for this client.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage users associated with {client.companyName}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                User management interface will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Settings</CardTitle>
              <CardDescription>
                Manage settings for {client.companyName}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Client-specific settings will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
