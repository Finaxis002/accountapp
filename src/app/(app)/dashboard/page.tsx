"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { transactions as staticTransactions } from "@/lib/data";
import { useCompany } from "@/contexts/company-context";
import { DollarSign, CreditCard, Users, Building, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Company } from "@/lib/types";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "INR" }).format(
    amount
  );

export default function DashboardPage() {
  const { selectedCompanyId } = useCompany();
  const [companyData, setCompanyData] = React.useState<any>(null);
  const [companyName, setCompanyName] = React.useState("");
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [users, setUsers] = React.useState<any[]>([]);

  const { toast } = useToast();

  React.useEffect(() => {
    async function fetchCompanyDashboard() {
      if (!selectedCompanyId) {
        setIsLoading(false);
        setCompanyData(null);
        setCompanyName("");
        return;
      }
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");

        // TODO: Replace with a real API endpoint when available
        // For now, simulating an API call
        console.log(`Fetching dashboard for company: ${selectedCompanyId}`);
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay
        const mockCompanyName = "Acme Corporation";

        const mockData = {
          totalSales: Math.random() * 100000,
          totalPurchases: Math.random() * 50000,
          users: Math.floor(Math.random() * 20) + 1,
          id: selectedCompanyId,
        };

        setCompanyData(mockData);
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
    }

    fetchCompanyDashboard();
  }, [selectedCompanyId, toast]);

  const fetchCompanies = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await fetch("http://localhost:5000/api/companies/my", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setCompanies(data);
  };

  React.useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: err.message || "Error fetching users",
      });
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const usersOfSelectedCompany = users.filter((user) =>
    user.companies.some((company: any) =>
      typeof company === "string"
        ? company === selectedCompanyId
        : company._id === selectedCompanyId
    )
  );

  const totalUsers = usersOfSelectedCompany.length;

  const selectedCompany = companies.find(
    (company) => company._id === selectedCompanyId
  );

  const kpiData = [
    {
      title: "Total Sales",
      value: formatCurrency(companyData?.totalSales || 0),
      icon: DollarSign,
    },
    {
      title: "Total Purchases",
      value: formatCurrency(companyData?.totalPurchases || 0),
      icon: CreditCard,
    },
    {
      title: "Users of selected company",
      value: totalUsers.toString(),
      icon: Users,
    },
    {
      title: "Selected Company",
      value: selectedCompany?.companyName || "N/A",
      icon: Building,
    },
  ];

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-4 w-4 bg-muted rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !selectedCompanyId ? (
        <Card className="flex flex-col items-center justify-center p-12 border-dashed">
          <Building className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Company Selected</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Please select a company from the header to view its dashboard.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RecentTransactions transactions={staticTransactions.slice(0, 5)} />
    </div>
  );
}
