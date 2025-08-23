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
  // import { columns } from "@/components/transactions/columns";
  import { columns as makeTxColumns } from "@/components/transactions/columns";

  import type { Client, Transaction } from "@/lib/types";
  import { useToast } from "@/hooks/use-toast";
  import { Loader2 } from "lucide-react";
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
  import { env } from "process";
  import { ExportTransactions } from "./export-transaction";
  import { issueInvoiceNumber } from "@/lib/invoices";


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
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
    const [sales, setSales] = React.useState<Transaction[]>([]);
    const [purchases, setPurchases] = React.useState<Transaction[]>([]);
    const [receipts, setReceipts] = React.useState<Transaction[]>([]);
    const [payments, setPayments] = React.useState<Transaction[]>([]);

    
    const [journals, setJournals] = React.useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const { toast } = useToast();

    // put these above useEffect
    const idOf = (v: any) =>
      typeof v === "string" ? v : v?._id || v?.$oid || v?.id || "";

    const filterByCompany = <T extends { company?: any }>(
      arr: T[],
      companyId?: string | null
    ) => {
      if (!companyId) return arr;
      return arr.filter(
        (doc: any) => idOf(doc.company?._id ?? doc.company) === companyId
      );
    };

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

          // setSales(
          //   (salesData.entries || salesData || []).map((s: any) => ({
          //     ...s,
          //     type: "sales",
          //   }))
          // );
          // setPurchases(
          //   (purchasesData || []).map((p: any) => ({ ...p, type: "purchases" }))
          // );
          // setReceipts(
          //   (receiptsData || []).map((r: any) => ({ ...r, type: "receipt" }))
          // );
          // setPayments(
          //   (paymentsData || []).map((p: any) => ({ ...p, type: "payment" }))
          // );
          // setJournals(
          //   (journalsData || []).map((j: any) => ({
          //     ...j,
          //     description: j.narration,
          //     type: "journal",
          //   }))
          // );
          const salesArr = (salesData.entries || salesData || []).map(
            (s: any) => ({ ...s, type: "sales" })
          );
          const purchasesArr = (purchasesData || []).map((p: any) => ({
            ...p,
            type: "purchases",
          }));
          const receiptsArr = (receiptsData || []).map((r: any) => ({
            ...r,
            type: "receipt",
          }));
          const paymentsArr = (paymentsData || []).map((p: any) => ({
            ...p,
            type: "payment",
          }));
          const journalsArr = (journalsData || []).map((j: any) => ({
            ...j,
            description: j.narration,
            type: "journal",
          }));

          setSales(filterByCompany(salesArr, selectedCompanyId));
          setPurchases(filterByCompany(purchasesArr, selectedCompanyId));
          setReceipts(filterByCompany(receiptsArr, selectedCompanyId));
          setPayments(filterByCompany(paymentsArr, selectedCompanyId));
          setJournals(filterByCompany(journalsArr, selectedCompanyId));
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

    // put below your other useState hooks
  const [invNoByTxId, setInvNoByTxId] = React.useState<Record<string, string>>({});

  // ensure number exists for a transaction row
  async function ensureInvoiceNumberFor(tx: any): Promise<string> {
    const existing = tx.invoiceNumber || invNoByTxId[tx._id];
    if (existing) return existing;

    const companyId = idOf(tx.company?._id ?? tx.company);
    if (!companyId) throw new Error("No companyId on this transaction");

    const issued = await issueInvoiceNumber(companyId);
    setInvNoByTxId((m) => ({ ...m, [tx._id]: issued }));
    return issued;
  }


    const handleAction = () => {
      toast({
        title: "Action not available",
        description:
          "Editing and deleting transactions is not available from the analytics dashboard.",
      });
    };

    const onPreview = async (tx: any) => {
    try {
      const invNo = await ensureInvoiceNumberFor(tx);
      window.open(`/invoices/${tx._id}?invno=${encodeURIComponent(invNo)}`, "_blank");
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Couldn’t issue invoice number",
        description: e?.message || "Try again.",
      });
    }
  };

  const onDownloadInvoice = async (tx: any) => {
    try {
          console.log("[onDownload] Transaction:", tx);
      const invNo = await ensureInvoiceNumberFor(tx);
      console.log("[onDownload] Got invoice number:", invNo);
      window.open(`/invoices/${tx._id}/download?invno=${encodeURIComponent(invNo)}&companyId=${idOf(tx.company)}`,
        "_blank");
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Couldn’t issue invoice number",
        description: e?.message || "Try again.",
      });
    }
  };


  const onViewItems = (tx: Transaction) => {
    // e.g. open a modal / drawer to show tx items
    console.log("[onViewItems]", tx);
  };

  console.log("[TransactionsTab] wiring columns", {
    onPreview: typeof onPreview,
    onDownloadInvoice: typeof onDownloadInvoice,
    onViewItems: typeof onViewItems,
  });

    // const tableColumns = React.useMemo(
    //   () =>
    //     columns({
    //       onDownload: handleAction,
    //       onEdit: handleAction,
    //       onDelete: handleAction,
    //       companyMap,
    //     }),
    //   [companyMap]
    // );

    const tableColumns = React.useMemo(
    () =>
     makeTxColumns({
        onPreview,                 // ✅ add this
        onDownloadInvoice, 
        onViewItems,               // ✅ use real onDownload
        onEdit: handleAction,
        onDelete: handleAction,
        companyMap,
        serviceNameById,
      }),
    [onPreview, onDownloadInvoice, onViewItems, handleAction, companyMap, serviceNameById]
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
        <div className="flex items-center justify-between mb-3">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
            <TabsTrigger value="receipts">Receipts</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="journals">Journals</TabsTrigger>
          </TabsList>

          <ExportTransactions
            selectedClientId={selectedClient._id}
            companyMap={companyMap}
            defaultCompanyId={selectedCompanyId}
            onExported={(n) => console.log(`Exported ${n} rows`)}
          />
        </div>
        <TabsContent value="all" className="mt-4">
          {renderContent(allTransactions)}
        </TabsContent>
        <TabsContent value="sales" className="mt-4">
          {renderContent(sales)}
        </TabsContent>
        <TabsContent value="purchases" className="mt-4">
          {renderContent(purchases)}
        </TabsContent>
        <TabsContent value="receipts" className="mt-4">
          {renderContent(receipts)}
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          {renderContent(payments)}
        </TabsContent>
        <TabsContent value="journals" className="mt-4">
          {renderContent(journals)}
        </TabsContent>
      </Tabs>
    );
  }
