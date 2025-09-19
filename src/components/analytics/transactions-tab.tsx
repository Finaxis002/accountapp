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
import { columns as makeTxColumns } from "@/components/transactions/columns";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { ChevronDown } from "lucide-react"; 
import type { Client, Transaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, Server } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
const [selectedTab, setSelectedTab] = React.useState("all");
  const [isItemsDialogOpen, setIsItemsDialogOpen] = React.useState(false);
  const [itemsToView, setItemsToView] = React.useState<any[]>([]);
  const [productsList, setProductsList] = React.useState<any[]>([]);
  const [servicesList, setServicesList] = React.useState<any[]>([]);
const [isDropdownOpen, setIsDropdownOpen] = React.useState(false); 
  const productNameById = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const p of productsList) {
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
      const productName =
        productNameById.get(p.product) || p.product?.name || "(product)";

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

    const svcArr = Array.isArray(tx.services)
      ? tx.services
      : Array.isArray(tx.service)
        ? tx.service
        : [];

    const svcs = svcArr.map((s: any) => {
      const id =
        typeof s.service === "object"
          ? s.service._id
          : s.service ??
          (typeof s.serviceName === "object"
            ? s.serviceName._id
            : s.serviceName);

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

        // Response parsing utilities (same as in TransactionsPage)
        const parseResponse = (data: any, possibleArrayKeys: string[] = []) => {
          if (Array.isArray(data)) return data;

          // Check for common success patterns
          if (data?.success && Array.isArray(data?.data)) return data.data;
          if (data?.success && Array.isArray(data?.entries))
            return data.entries;

          // Check for specific keys
          for (const key of possibleArrayKeys) {
            if (Array.isArray(data?.[key])) return data[key];
          }

          // Fallback: check any array in the response
          for (const key in data) {
            if (Array.isArray(data[key])) {
              console.warn(`Found array in unexpected key: ${key}`);
              return data[key];
            }
          }

          console.warn("No array data found in response:", data);
          return [];
        };

        const parseSalesResponse = (data: any) => {
          return parseResponse(data, ["salesEntries", "sales", "entries"]);
        };

        const parsePurchasesResponse = (data: any) => {
          return parseResponse(data, [
            "purchaseEntries",
            "purchases",
            "entries",
          ]);
        };

        const parseReceiptsResponse = (data: any) => {
          return parseResponse(data, ["receiptEntries", "receipts", "entries"]);
        };

        const parsePaymentsResponse = (data: any) => {
          return parseResponse(data, ["paymentEntries", "payments", "entries"]);
        };

        const parseJournalsResponse = (data: any) => {
          // Check for the correct nested structure of the data
          if (data?.success && Array.isArray(data?.data)) {
            return data?.data; // Access the 'data' array directly
          }
          return []; // Default return if data is malformed
        };

        const parseProductsResponse = (data: any) => {
          return parseResponse(data, ["products", "items", "data"]);
        };

        const parseServicesResponse = (data: any) => {
          return parseResponse(data, ["services", "data"]);
        };

        const base = process.env.NEXT_PUBLIC_BASE_URL || "";
        const byCompany = !!selectedCompanyId;

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
        const productsUrl = `${base}/api/products`;
        const servicesUrl = `${base}/api/services`;

        const [
          salesRes,
          purchasesRes,
          receiptsRes,
          paymentsRes,
          journalsRes,
          productsRes,
          servicesRes,
        ] = await Promise.all([
          fetch(salesUrl, auth),
          fetch(purchasesUrl, auth),
          fetch(receiptsUrl, auth),
          fetch(paymentsUrl, auth),
          fetch(journalsUrl, auth),
          fetch(productsUrl, auth),
          fetch(servicesUrl, auth),
        ]);

        // Check response statuses
        const mustOk = async (res: Response, label: string) => {
          if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(
              `${label} API ${res.status} ${res.statusText} – ${txt}`
            );
          }
        };

        await Promise.all([
          mustOk(salesRes, "Sales"),
          mustOk(purchasesRes, "Purchases"),
          mustOk(receiptsRes, "Receipts"),
          mustOk(paymentsRes, "Payments"),
          mustOk(journalsRes, "Journals"),
          mustOk(productsRes, "Products"),
          mustOk(servicesRes, "Services"),
        ]);

        const [
          salesData,
          purchasesData,
          receiptsData,
          paymentsData,
          journalsData,
          productsData,
          servicesData,
        ] = await Promise.all([
          salesRes.json(),
          purchasesRes.json(),
          receiptsRes.json(),
          paymentsRes.json(),
          journalsRes.json(),
          productsRes.json(),
          servicesRes.json(),
        ]);

        // Parse the responses using the same logic as TransactionsPage
        const salesArr = parseSalesResponse(salesData).map((s: any) => ({
          ...s,
          type: "sales",
        }));
        const purchasesArr = parsePurchasesResponse(purchasesData).map(
          (p: any) => ({
            ...p,
            type: "purchases",
          })
        );
        const receiptsArr = parseReceiptsResponse(receiptsData).map(
          (r: any) => ({
            ...r,
            type: "receipt",
          })
        );
        const paymentsArr = parsePaymentsResponse(paymentsData).map(
          (p: any) => ({
            ...p,
            type: "payment",
          })
        );

        // CRITICAL: Process journals data properly like in TransactionsPage
        const journalsArr = parseJournalsResponse(journalsData).map(
          (j: any) => ({
            ...j,
            description: j.narration || j.description,
            type: "journal",
            // Add empty arrays for missing properties that columns might expect
            products: j.products || [],
            services: j.services || [],
            invoiceNumber: j.invoiceNumber || "",
            party: j.party || "",
          })
        );

        const productsList = parseProductsResponse(productsData);
        const servicesList = parseServicesResponse(servicesData);

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

        console.log("Journals Data:", journalsArr);
        console.log("Receipt Data :", receiptsArr);
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

  const [invNoByTxId, setInvNoByTxId] = React.useState<Record<string, string>>(
    {}
  );

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
        title: "Couldn't issue invoice number",
        description: e?.message || "Try again.",
      });
    }
  };

  const onDownloadInvoice = async (tx: any) => {
    try {
      const invNo = await ensureInvoiceNumberFor(tx);
      window.open(
        `/invoices/${tx._id}/download?invno=${encodeURIComponent(
          invNo
        )}&companyId=${idOf(tx.company)}`,
        "_blank"
      );
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Couldn't issue invoice number",
        description: e?.message || "Try again.",
      });
    }
  };

  const tableColumns = React.useMemo(
    () =>
      makeTxColumns({
        onPreview,
        onViewItems: handleViewItems,
        onEdit: handleAction,
        onDelete: handleAction,
        companyMap,
        serviceNameById,
        onSendInvoice: () => { },
      }),
    [onPreview, handleViewItems, handleAction, companyMap, serviceNameById]
  );

  const allTransactions = React.useMemo(
    () =>
      [...sales, ...purchases, ...receipts, ...payments, ...journals].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [sales, purchases, receipts, payments, journals]
  );
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);
  React.useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    listener();
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);
  return matches;
}
 
  const isMobile = useMediaQuery("(max-width: 768px)");

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

  if (isMobile) {
    // 📱 Mobile → Card layout
    return (
      <TransactionsTable
        data={data}
        companyMap={companyMap}
        serviceNameById={serviceNameById}
        onPreview={onPreview}
        onEdit={handleAction}
        onDelete={handleAction}
        onViewItems={handleViewItems}
        onSendInvoice={() => {}}
      />
    );
  }

  // 🖥 Desktop → DataTable
  return <DataTable columns={tableColumns} data={data} />;
};
const handleTabChange = (tab: string) => {
  setSelectedTab(tab);    
  setIsDropdownOpen(false); 
};
  return (
    <>
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>

        <div className="flex items-center justify-between mb-3">
          <div className="hidden sm:block">
            <TabsList className="flex space-x-1 overflow-x-auto">
              <TabsTrigger value="all" className="flex items-center px-3 py-1.5 text-sm">All</TabsTrigger>
              <TabsTrigger value="sales" className="flex items-center px-3 py-1.5 text-sm">Sales</TabsTrigger>
              <TabsTrigger value="purchases" className="flex items-center px-3 py-1.5 text-sm">Purchases</TabsTrigger>
              <TabsTrigger value="receipts" className="flex items-center px-3 py-1.5 text-sm">Receipts</TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center px-3 py-1.5 text-sm">Payments</TabsTrigger>
              <TabsTrigger value="journals" className="flex items-center px-3 py-1.5 text-sm">Journals</TabsTrigger>
            </TabsList>
          </div>
<div className="block sm:hidden">
  <div className="flex items-center justify-between px-3 py-2 bg-white border-b">
   
    <div
      className="flex items-center"
      onClick={() => setIsDropdownOpen((prev) => !prev)}
    >
      <span className="text-sm">{selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)}</span>
      <ChevronDown className="ml-2 text-sm" />
    </div>

    {/* Dropdown Menu */}
    {isDropdownOpen && (
      <div className="absolute bg-white shadow-lg rounded mt-2 w-40 z-10">
        <ul className="space-y-2 p-2">
          <li
            className="cursor-pointer hover:bg-gray-200 p-2 rounded"
            onClick={() => handleTabChange("all")}
          >
            All
          </li>
          <li
            className="cursor-pointer hover:bg-gray-200 p-2 rounded"
            onClick={() => handleTabChange("sales")}
          >
            Sales
          </li>
          <li
            className="cursor-pointer hover:bg-gray-200 p-2 rounded"
            onClick={() => handleTabChange("purchases")}
          >
            Purchases
          </li>
          <li
            className="cursor-pointer hover:bg-gray-200 p-2 rounded"
            onClick={() => handleTabChange("receipts")}
          >
            Receipts
          </li>
          <li
            className="cursor-pointer hover:bg-gray-200 p-2 rounded"
            onClick={() => handleTabChange("payments")}
          >
            Payments
          </li>
          <li
            className="cursor-pointer hover:bg-gray-200 p-2 rounded"
            onClick={() => handleTabChange("journals")}
          >
            Journals
          </li>
        </ul>
      </div>
    )}
  </div>
</div>

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
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
            <DialogDescription>
              A detailed list of all items in this transaction.
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
                      item.quantity !== null &&
                      !isNaN(Number(item.quantity))
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
