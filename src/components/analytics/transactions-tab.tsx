"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { DataTable } from "@/components/transactions/data-table";
import { columns } from "@/components/transactions/columns";
import type { Client, Transaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TransactionsTabProps {
  selectedClient: Client;
  selectedCompanyId: string | null;
  companyMap: Map<string, string>;
}

export function TransactionsTab({
  selectedClient,
  selectedCompanyId,
  companyMap,
}: TransactionsTabProps) {
     const baseURL = process.env. NEXT_PUBLIC_BASE_URL;
  const [sales, setSales] = React.useState<Transaction[]>([]);
  const [purchases, setPurchases] = React.useState<Transaction[]>([]);
  const [receipts, setReceipts] = React.useState<Transaction[]>([]);
  const [payments, setPayments] = React.useState<Transaction[]>([]);
  const [journals, setJournals] = React.useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    async function fetchTransactions() {
      if (!selectedClient?._id) return;

      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");

        const buildRequest = (url: string) =>
          fetch(url, { headers: { Authorization: `Bearer ${token}` } });

        let salesUrl, purchasesUrl, receiptsUrl, paymentsUrl, journalsUrl;

        if (selectedCompanyId) {
          const companyQuery = `?companyId=${selectedCompanyId}`;
          salesUrl = `${baseURL}/api/sales${companyQuery}`;
          purchasesUrl = `${baseURL}/api/purchase${companyQuery}`;
          receiptsUrl = `${baseURL}/api/receipts${companyQuery}`;
          paymentsUrl = `${baseURL}/api/payments${companyQuery}`;
          journalsUrl = `${baseURL}/api/journals${companyQuery}`;
        } else {
          const clientQuery = `/by-client/${selectedClient._id}`;
          salesUrl = `${baseURL}/api/sales${clientQuery}`;
          purchasesUrl = `${baseURL}/api/purchase${clientQuery}`;
          // Assuming similar client-based endpoints exist for these
          receiptsUrl = `${baseURL}/api/receipts/by-client/${selectedClient._id}`;
          paymentsUrl = `${baseURL}/api/payments/by-client/${selectedClient._id}`;
          journalsUrl = `${baseURL}/api/journals/by-client/${selectedClient._id}`;
        }

        const [salesRes, purchasesRes, receiptsRes, paymentsRes, journalsRes] =
          await Promise.all([
            buildRequest(salesUrl),
            buildRequest(purchasesUrl),
            buildRequest(receiptsUrl),
            buildRequest(paymentsUrl),
            buildRequest(journalsUrl),
          ]);

        const salesData = await salesRes.json();
        const purchasesData = await purchasesRes.json();
        const receiptsData = await receiptsRes.json();
        const paymentsData = await paymentsRes.json();
        const journalsData = await journalsRes.json();

        setSales(
          (salesData.entries || salesData || []).map((s: any) => ({
            ...s,
            type: "sales",
          }))
        );
        setPurchases(
          (purchasesData || []).map((p: any) => ({ ...p, type: "purchases" }))
        );
        setReceipts(
          (receiptsData || []).map((r: any) => ({ ...r, type: "receipt" }))
        );
        setPayments(
          (paymentsData || []).map((p: any) => ({ ...p, type: "payment" }))
        );
        setJournals(
          (journalsData || []).map((j: any) => ({
            ...j,
            description: j.narration,
            type: "journal",
          }))
        );
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load transactions",
          description:
            error instanceof Error ? error.message : "Something went wrong.",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransactions();
  }, [selectedClient, selectedCompanyId, toast]);

  const handleAction = () => {
    toast({
      title: "Action not available",
      description:
        "Editing and deleting transactions is not available from the analytics dashboard.",
    });
  };

  const tableColumns = React.useMemo(
    () =>
      columns({
        generateInvoicePDF: handleAction,
        onEdit: handleAction,
        onDelete: handleAction,
        companyMap,
      }),
    [companyMap]
  );

  const allTransactions = React.useMemo(
    () =>
      [...sales, ...purchases, ...receipts, ...payments, ...journals].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [sales, purchases, receipts, payments, journals]
  );

  const renderContent = (data: Transaction[]) => {
    if (isLoading) {
      return (
        <Card>
          <CardContent className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      );
    }
    return <DataTable columns={tableColumns} data={data} />;
  };

  return (
    <Tabs defaultValue="all">
      {/* Scrollable tabs container for mobile */}
      <div className="relative">
        <div className="overflow-x-auto pb-2 hide-scrollbar">
          <TabsList className="flex w-max space-x-1 px-1">
            <TabsTrigger
              value="all"
              className="px-3 py-1.5 text-sm whitespace-nowrap"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="sales"
              className="px-3 py-1.5 text-sm whitespace-nowrap"
            >
              Sales
            </TabsTrigger>
            <TabsTrigger
              value="purchases"
              className="px-3 py-1.5 text-sm whitespace-nowrap"
            >
              Purchases
            </TabsTrigger>
            <TabsTrigger
              value="receipts"
              className="px-3 py-1.5 text-sm whitespace-nowrap"
            >
              Receipts
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="px-3 py-1.5 text-sm whitespace-nowrap"
            >
              Payments
            </TabsTrigger>
            <TabsTrigger
              value="journals"
              className="px-3 py-1.5 text-sm whitespace-nowrap"
            >
              Journals
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Gradient fade effect on mobile (optional) */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden sm:hidden w-8 bg-gradient-to-l from-background"></div>
      </div>

      {/* Tab contents */}
      <div className="mt-4">
        <TabsContent value="all">{renderContent(allTransactions)}</TabsContent>
        <TabsContent value="sales">{renderContent(sales)}</TabsContent>
        <TabsContent value="purchases">{renderContent(purchases)}</TabsContent>
        <TabsContent value="receipts">{renderContent(receipts)}</TabsContent>
        <TabsContent value="payments">{renderContent(payments)}</TabsContent>
        <TabsContent value="journals">{renderContent(journals)}</TabsContent>
      </div>
    </Tabs>
  );
}
