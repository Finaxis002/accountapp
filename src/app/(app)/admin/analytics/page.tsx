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
  Users,
  Building,
  UserPlus,
  Settings,
  FileBarChart2,
  LayoutGrid,
  ArrowRightLeft,
  ChevronDown,
} from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import type { Client } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { DashboardTab } from "@/components/analytics/dashboard-tab";
import { TransactionsTab } from "@/components/analytics/transactions-tab";
import { CompaniesTab } from "@/components/analytics/companies-tab";
import { UsersTab } from "@/components/analytics/users-tab";
import { useSearchParams, useRouter } from "next/navigation";

export default function AnalyticsDashboardPage() {
  const [clients, setClients] = React.useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = React.useState<string>("");
  const [isClientsLoading, setIsClientsLoading] = React.useState(true);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedClient = React.useMemo(() => {
    return clients.find((c) => c._id === selectedClientId);
  }, [clients, selectedClientId]);

  React.useEffect(() => {
    const clientIdFromUrl = searchParams.get("clientId");
    if (clientIdFromUrl) {
      setSelectedClientId(clientIdFromUrl);
    }
  }, [searchParams]);

  React.useEffect(() => {
    async function fetchClients() {
      setIsClientsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");
        const res = await fetch("http://localhost:5000/api/clients", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch clients");
        const data = await res.json();
        setClients(data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load clients",
          description:
            error instanceof Error ? error.message : "Something went wrong.",
        });
      } finally {
        setIsClientsLoading(false);
      }
    }
    fetchClients();
  }, [toast]);

  const clientOptions = clients.map((client) => ({
    value: client._id,
    label: client.contactName,
  }));

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    router.push(`/admin/analytics?clientId=${clientId}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Client Analytics
          </h2>
          <p className="text-muted-foreground">
            Select a client to view their detailed dashboard and controls.
          </p>
        </div>
        <div className="w-full max-w-sm">
          {isClientsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading clients...</span>
            </div>
          ) : (
            <Combobox
              options={clientOptions}
              value={selectedClientId}
              onChange={handleClientChange}
              placeholder="Select a client..."
              searchPlaceholder="Search clients..."
              noResultsText="No clients found."
            />
          )}
        </div>
      </div>

      {!selectedClient && !isClientsLoading && (
        <Card className="flex flex-col items-center justify-center p-12 border-dashed">
          <Users className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Client Selected</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Please select a client from the dropdown to view their data.
          </p>
        </Card>
      )}

      {selectedClient && (
        <Tabs defaultValue="dashboard">
          <div className="flex items-center justify-between border-b pb-4">
            <TabsList>
              <TabsTrigger value="dashboard">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="transactions">
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="companies">
                <Building className="mr-2 h-4 w-4" />
                Companies
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="mr-2 h-4 w-4" />
                Users
              </TabsTrigger>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 font-normal text-muted-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
                  >
                    <FileBarChart2 className="h-4 w-4" />
                    Reports
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem asChild>
                    <Link href="/reports/profit-loss">Profit & Loss</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/reports/balance-sheet">Balance Sheet</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TabsList>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <UserPlus className="mr-2 h-4 w-4" /> Add User
              </Button>
              <Button>
                <Settings className="mr-2 h-4 w-4" /> Client Settings
              </Button>
            </div>
          </div>

          <TabsContent value="dashboard" className="space-y-6 mt-6">
            <DashboardTab selectedClient={selectedClient} />
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            <TransactionsTab selectedClient={selectedClient} />
          </TabsContent>

          <TabsContent value="companies" className="mt-6">
            <CompaniesTab
              selectedClientId={selectedClientId}
              selectedClient={selectedClient}
            />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UsersTab selectedClient={selectedClient} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
