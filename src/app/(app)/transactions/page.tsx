"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/transactions/data-table";
import { columns } from "@/components/transactions/columns";
import {
  PlusCircle,
  Loader2,
  Download,
  FileText,
  Package,
  Server,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCompany } from "@/contexts/company-context";
import { useToast } from "@/hooks/use-toast";
import type { Transaction, Company, Party, Vendor } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import "@/app/invoice.css";
import "@/app/invoice-template-2.css";
import "@/app/invoice-template-3.css";
import { InvoicePreview } from "@/components/invoices/invoice-preview";
import { Item } from "@/lib/types";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { getUnifiedLines } from "@/lib/utils";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
};

export default function TransactionsPage() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [isItemsDialogOpen, setIsItemsDialogOpen] = React.useState(false);
  const [transactionToDelete, setTransactionToDelete] =
    React.useState<Transaction | null>(null);
  const [transactionToEdit, setTransactionToEdit] =
    React.useState<Transaction | null>(null);
  const [transactionToPreview, setTransactionToPreview] =
    React.useState<Transaction | null>(null);
  const [itemsToView, setItemsToView] = React.useState<Item[]>([]);
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [sales, setSales] = React.useState<Transaction[]>([]);
  const [purchases, setPurchases] = React.useState<Transaction[]>([]);
  const [receipts, setReceipts] = React.useState<Transaction[]>([]);
  const [payments, setPayments] = React.useState<Transaction[]>([]);
  const [journals, setJournals] = React.useState<Transaction[]>([]);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  // top of component state
  const [productsList, setProductsList] = React.useState<any[]>([]);
  const [servicesList, setServicesList] = React.useState<any[]>([]);

  const [parties, setParties] = React.useState<Party[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { selectedCompanyId } = useCompany();
  const { toast } = useToast();

  const fetchTransactions = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const buildRequest = (url: string) =>
        fetch(url, { headers: { Authorization: `Bearer ${token}` } });

      const queryParam = selectedCompanyId
        ? `?companyId=${selectedCompanyId}`
        : "";
      const [
        salesRes,
        purchasesRes,
        receiptsRes,
        paymentsRes,
        journalsRes,
        companiesRes,
        partiesRes,
        vendorsRes,
        productsRes, // NEW
        servicesRes, // NEW
      ] = await Promise.all([
        buildRequest(`${baseURL}/api/sales${queryParam}`),
        buildRequest(`${baseURL}/api/purchase${queryParam}`),
        buildRequest(`${baseURL}/api/receipts${queryParam}`),
        buildRequest(`${baseURL}/api/payments${queryParam}`),
        buildRequest(`${baseURL}/api/journals${queryParam}`),
        buildRequest(`${baseURL}/api/companies/my`),
        buildRequest(`${baseURL}/api/parties`),
        buildRequest(`${baseURL}/api/vendors`),
        buildRequest(`${baseURL}/api/products`), // NEW
        buildRequest(`${baseURL}/api/services`), // NEW
      ]);

      const salesData = await salesRes.json();
      const purchasesData = await purchasesRes.json();
      const receiptsData = await receiptsRes.json();
      const paymentsData = await paymentsRes.json();
      const journalsData = await journalsRes.json();
      const companiesData = await companiesRes.json();
      const partiesData = await partiesRes.json();
      const vendorsData = await vendorsRes.json();
      // after parsing json:
      const productsJson = await productsRes.json();
      const servicesJson = await servicesRes.json();

      console.log("productsJson :", productsJson);
      console.log("servicesJson :", servicesJson);

      setProductsList(
        Array.isArray(productsJson) ? productsJson : productsJson.products || []
      );
      setServicesList(
        Array.isArray(servicesJson) ? servicesJson : servicesJson.services || []
      );

      setSales(
        salesData.entries?.map((s: any) => ({ ...s, type: "sales" })) || []
      );
      setPurchases(
        purchasesData?.map((p: any) => ({ ...p, type: "purchases" })) || []
      );
      setReceipts(
        receiptsData?.map((r: any) => ({ ...r, type: "receipt" })) || []
      );
      setPayments(
        paymentsData?.map((p: any) => ({ ...p, type: "payment" })) || []
      );
      setJournals(
        journalsData?.map((j: any) => ({
          ...j,
          description: j.narration,
          type: "journal",
        })) || []
      );
      setCompanies(companiesData);
      setParties(
        Array.isArray(partiesData) ? partiesData : partiesData.parties || []
      );
      setVendors(
        Array.isArray(vendorsData) ? vendorsData : vendorsData.vendors || []
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
  }, [selectedCompanyId, toast]);

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

  React.useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleOpenForm = (transaction: Transaction | null = null) => {
    setTransactionToEdit(transaction);
    setIsFormOpen(true);
  };

  const handleOpenDeleteDialog = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setIsAlertOpen(true);
  };

  const handleOpenPreviewDialog = (transaction: Transaction) => {
    setTransactionToPreview(transaction);
    setIsPreviewOpen(true);
  };

  // change signature:
  const handleViewItems = (tx: any) => {
    const prods = (tx.products || []).map((p: any) => {
      // Debug: Log the product ID and name lookup
      const productName =
        productNameById.get(p.product) || p.product?.name || "(product)";
      console.log("Product lookup:", {
        id: p.product,
        foundName: productNameById.get(p.product),
        productObj: p.product,
      });

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

    const svcArr = tx.service ?? tx.services ?? [];
    const svcs = svcArr.map((s: any) => ({
      itemType: "service" as const,
      name:
        serviceNameById.get(
          typeof s.serviceName === "object" ? s.serviceName._id : s.serviceName
        ) || "(service)",
      quantity: "",
      unitType: "",
      pricePerUnit: "",
      description: s.description || "",
      amount: Number(s.amount) || 0,
    }));

    setItemsToView([...prods, ...svcs]);
    setIsItemsDialogOpen(true);
  };

  React.useEffect(() => {
    console.log("Products List:", productsList);
    console.log("Product Name Map:", productNameById);
  }, [productsList, productNameById]);

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const endpointMap: Record<string, string> = {
        sales: `/api/sales/${transactionToDelete._id}`,
        purchases: `/api/purchase/${transactionToDelete._id}`,
        receipt: `/api/receipts/${transactionToDelete._id}`,
        payment: `/api/payments/${transactionToDelete._id}`,
        journal: `/api/journals/${transactionToDelete._id}`,
      };

      const endpoint = endpointMap[transactionToDelete.type];
      if (!endpoint)
        throw new Error(
          `Invalid transaction type: ${transactionToDelete.type}`
        );

      const res = await fetch(`${baseURL}${endpoint}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete transaction.");
      }

      toast({
        title: "Transaction Deleted",
        description: "The transaction has been successfully removed.",
      });

      fetchTransactions();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsAlertOpen(false);
      setTransactionToDelete(null);
    }
  };

  const allTransactions = React.useMemo(
    () =>
      [...sales, ...purchases, ...receipts, ...payments, ...journals].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [sales, purchases, receipts, payments, journals]
  );

  const companyMap = React.useMemo(() => {
    const map = new Map<string, string>();
    companies.forEach((company) => {
      map.set(company._id, company.businessName);
    });
    return map;
  }, [companies]);

  const tableColumns = React.useMemo(() => {
    const baseCols = columns({
      onViewItems: (tx) => handleViewItems(tx),
      onPreview: handleOpenPreviewDialog,
      onEdit: handleOpenForm,
      onDelete: handleOpenDeleteDialog,
      companyMap,
      serviceNameById, // Add this line
    });

    if (companies.length <= 1) {
      return baseCols.filter((col) => col.id !== "company");
    }
    return baseCols;
  }, [companyMap, companies.length, serviceNameById]); // Add serviceNameById to dependencies

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground">
            A list of all financial activities for the selected company.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => handleOpenForm(null)}
                className="w-full md:w-auto"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                New Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl grid-rows-[auto,1fr,auto] max-h-[90vh] p-0">
              <DialogHeader className="p-6">
                <DialogTitle>
                  {transactionToEdit
                    ? "Edit Transaction"
                    : "Create a New Transaction"}
                </DialogTitle>
                <DialogDescription>
                  {transactionToEdit
                    ? "Update the details of the financial event."
                    : "Fill in the details below to record a new financial event."}
                </DialogDescription>
              </DialogHeader>
              <TransactionForm
                transactionToEdit={transactionToEdit}
                onFormSubmit={() => {
                  setIsFormOpen(false);
                  setTransactionToEdit(null);
                  fetchTransactions();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTransaction}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl p-0 h-[90vh] flex flex-col">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Invoice Preview</DialogTitle>
            <DialogDescription>
              This is a preview of the invoice. You can change the template and
              download it as a PDF.
            </DialogDescription>
          </DialogHeader>
          <InvoicePreview
            transaction={transactionToPreview}
            company={
              companies.find(
                (c) => c._id === transactionToPreview?.company?._id
              ) || null
            }
            party={
              parties.find(
                (p) =>
                  p._id === (transactionToPreview?.party as any)?._id ||
                  transactionToPreview?.party === p._id
              ) || null
            }
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isItemsDialogOpen} onOpenChange={setIsItemsDialogOpen}>
        <DialogContent className="sm:max-w-xl">
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

      <Tabs defaultValue="all">
        <div className="overflow-x-auto pb-2">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
            <TabsTrigger value="receipts">Receipts</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="journals">Journals</TabsTrigger>
          </TabsList>
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
    </div>
  );
}
