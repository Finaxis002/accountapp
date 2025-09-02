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
import { Loader2, Package, Server } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { env } from "process";
import { ExportTransactions } from "./export-transaction";
import { issueInvoiceNumber } from "@/lib/invoices";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface TransactionsTabProps {
  selectedClient: Client;
  selectedCompanyId: string | null;
  companyMap: Map<string, string>;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
};

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

  const [isItemsDialogOpen, setIsItemsDialogOpen] = React.useState(false);
  const [itemsToView, setItemsToView] = React.useState<any[]>([]);
  const [productsList, setProductsList] = React.useState<any[]>([]);
   const [servicesList, setServicesList] = React.useState<any[]>([]);

  const productNameById = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const p of productsList) {
      // Ensure we're using the correct ID and name fields
      m.set(String(p._id), p.name || "(unnamed product)");
    }
    return m;
  }, [productsList]);


    const serviceNameById = React.useMemo(() => {
      const m = new Map<string, string>();
      for (const s of servicesList) m.set(String(s._id), s.serviceName);
      return m;
    }, [servicesList]);
  



  const handleViewItems = (tx: any) => {
    const prods = (tx.products || []).map((p: any) => {
      // Debug: Log the product ID and name lookup
      const productName =
        productNameById.get(p.product) || p.product?.name || "(product)";
      // console.log("Product lookup:", {
      //   id: p.product,
      //   foundName: productNameById.get(p.product),
      //   productObj: p.product,
      // });

      return {
        itemType: "product" as const,
        name: productName,
        quantity: p.quantity ?? "",
        unitType: p.unitType ?? "",
        pricePerUnit: p.pricePerUnit ?? "",
        description: "",
        amount: Number(p.amount) || 0,
      };
    });

    // inside handleViewItems
    const svcArr = Array.isArray(tx.services)
      ? tx.services
      : Array.isArray(tx.service)
      ? tx.service
      : [];

    const svcs = svcArr.map((s: any) => {
      // id can be raw ObjectId or populated doc; also support legacy s.serviceName
      const id =
        typeof s.service === "object"
          ? s.service._id
          : s.service ??
            (typeof s.serviceName === "object"
              ? s.serviceName._id
              : s.serviceName);


      // Now you can safely use the .get() method on serviceNameById, which is a Map
      const name =
        (id && serviceNameById.get(String(id))) ||
        (typeof s.service === "object" && s.service.serviceName) ||
        (typeof s.serviceName === "object" && s.serviceName.serviceName) ||
        "(service)";

      return {
        itemType: "service" as const,
        name,
        quantity: "",
        unitType: "",
        pricePerUnit: "",
        description: s.description || "",
        amount: Number(s.amount) || 0,
      };
    });

    setItemsToView([...prods, ...svcs]);
    setIsItemsDialogOpen(true);
  };

  // put these above useEffect
  const idOf = (v: any) =>
    typeof v === "string" ? v : v?._id || v?.$oid || v?.id || "";

  React.useEffect(() => {
    async function fetchTransactions() {
      if (!selectedClient?._id) return;

      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");

        const auth = { headers: { Authorization: `Bearer ${token}` } };

        // helper: coerce any API shape to an array
        const toArray = (x: any) => {
          if (Array.isArray(x)) return x;
          if (Array.isArray(x?.entries)) return x.entries;
          if (Array.isArray(x?.data)) return x.data;
          if (Array.isArray(x?.docs)) return x.docs;
          if (Array.isArray(x?.results)) return x.results;
          if (Array.isArray(x?.items)) return x.items;
          return [];
        };

        const mustOk = async (res: Response, label: string) => {
          if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(
              `${label} API ${res.status} ${res.statusText} – ${txt}`
            );
          }
        };

        const base = process.env.NEXT_PUBLIC_BASE_URL || "";
        const byCompany = !!selectedCompanyId;

        // 🔁 Use PLURAL resource names consistently (adjust if your BE is truly singular)
        const salesUrl = byCompany
          ? `${base}/api/sales?companyId=${selectedCompanyId}`
          : `${base}/api/sales/by-client/${selectedClient._id}`;
        const purchasesUrl = byCompany
          ? `${base}/api/purchase?companyId=${selectedCompanyId}`
          : `${base}/api/purchase/by-client/${selectedClient._id}`;
        const receiptsUrl = byCompany
          ? `${base}/api/receipts?companyId=${selectedCompanyId}`
          : `${base}/api/receipts/by-client/${selectedClient._id}`;
        const paymentsUrl = byCompany
          ? `${base}/api/payments?companyId=${selectedCompanyId}`
          : `${base}/api/payments/by-client/${selectedClient._id}`;
        const journalsUrl = byCompany
          ? `${base}/api/journals?companyId=${selectedCompanyId}`
          : `${base}/api/journals/by-client/${selectedClient._id}`;

        const [salesRes, purchasesRes, receiptsRes, paymentsRes, journalsRes] =
          await Promise.all([
            fetch(salesUrl, auth),
            fetch(purchasesUrl, auth),
            fetch(receiptsUrl, auth),
            fetch(paymentsUrl, auth),
            fetch(journalsUrl, auth),
          ]);

        // Fail fast with a clear message if any call failed
        await Promise.all([
          mustOk(salesRes, "Sales"),
          mustOk(purchasesRes, "Purchases"),
          mustOk(receiptsRes, "Receipts"),
          mustOk(paymentsRes, "Payments"),
          mustOk(journalsRes, "Journals"),
        ]);

        const [
          salesData,
          purchasesData,
          receiptsData,
          paymentsData,
          journalsData,
        ] = await Promise.all([
          salesRes.json(),
          purchasesRes.json(),
          receiptsRes.json(),
          paymentsRes.json(),
          journalsRes.json(),
        ]);

        const salesArr = toArray(salesData).map((s: any) => ({
          ...s,
          type: "sales",
        }));
        const purchasesArr = toArray(purchasesData).map((p: any) => ({
          ...p,
          type: "purchases",
        }));
        const receiptsArr = toArray(receiptsData).map((r: any) => ({
          ...r,
          type: "receipt",
        }));
        const paymentsArr = toArray(paymentsData).map((p: any) => ({
          ...p,
          type: "payment",
        }));
        const journalsArr = toArray(journalsData).map((j: any) => ({
          ...j,
          description: j.narration,
          type: "journal",
        }));

        const idOf = (v: any) =>
          typeof v === "string" ? v : v?._id || v?.$oid || v?.id || "";
        const filterByCompany = <T extends { company?: any }>(
          arr: T[],
          companyId?: string | null
        ) =>
          !companyId
            ? arr
            : arr.filter(
                (doc: any) =>
                  idOf(doc.company?._id ?? doc.company) === companyId
              );

        setSales(filterByCompany(salesArr, selectedCompanyId));
        setPurchases(filterByCompany(purchasesArr, selectedCompanyId));
        setReceipts(filterByCompany(receiptsArr, selectedCompanyId));
        setPayments(filterByCompany(paymentsArr, selectedCompanyId));
        setJournals(filterByCompany(journalsArr, selectedCompanyId));
        setProductsList(productsList);
        setServicesList(servicesList);
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
  }, [selectedClient?._id, selectedCompanyId, toast]);

  // put below your other useState hooks
  const [invNoByTxId, setInvNoByTxId] = React.useState<Record<string, string>>(
    {}
  );

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
      window.open(
        `/invoices/${tx._id}?invno=${encodeURIComponent(invNo)}`,
        "_blank"
      );
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
      // console.log("[onDownload] Transaction:", tx);
      const invNo = await ensureInvoiceNumberFor(tx);
      // console.log("[onDownload] Got invoice number:", invNo);
      window.open(
        `/invoices/${tx._id}/download?invno=${encodeURIComponent(
          invNo
        )}&companyId=${idOf(tx.company)}`,
        "_blank"
      );
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
    // console.log("[onViewItems]", tx);
  };

  // console.log("[TransactionsTab] wiring columns", {
  //   onPreview: typeof onPreview,
  //   onDownloadInvoice: typeof onDownloadInvoice,
  //   onViewItems: typeof onViewItems,
  // });

  // OPTIONAL: if you want real names, hydrate `serviceMap` via an API call.
  const [serviceMap, setServiceMap] = React.useState<Map<string, string>>(
    new Map()
  );


  const tableColumns = React.useMemo(
    () =>
      makeTxColumns({
        onPreview,
        onViewItems: handleViewItems,
        onEdit: handleAction,
        onDelete: handleAction,
        companyMap,
        serviceNameById: serviceMap, // <-- pass the Map as serviceNameById
        onSendInvoice: () => {}, // <-- add a dummy function if not used
      }),
    [onPreview, onViewItems, handleAction, companyMap, serviceMap]
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
    <>
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

      <Dialog open={isItemsDialogOpen} onOpenChange={setIsItemsDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
            <DialogDescription>
              A detailed list of all items in this transaction..
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Price/Unit</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsToView.map((item, idx) => {
                  const isService = item.itemType === "service";
                  const qty =
                    !isService &&
                    item.quantity !== undefined &&
                    item.quantity !== null && // Add null check
                    !isNaN(Number(item.quantity)) // Ensure it's a valid number
                      ? item.quantity
                      : "—";
                  const rate = !isService
                    ? formatCurrency(Number(item?.pricePerUnit ?? 0))
                    : "—";
                  const total = formatCurrency(Number(item?.amount ?? 0));
                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {isService ? (
                            <Server className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Package className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div className="flex flex-col">
                            <span>{item?.name ?? "—"}</span>
                            {isService && item?.description ? (
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {item.description}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="hidden sm:table-cell capitalize">
                        {item.itemType ?? "—"}
                      </TableCell>

                      <TableCell className="text-center">{qty}</TableCell>

                      <TableCell className="text-right">{rate}</TableCell>

                      <TableCell className="text-right font-semibold">
                        {total}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
