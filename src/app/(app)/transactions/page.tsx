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

  const lastFetchRef = React.useRef<{
    timestamp: number;
    companyId: string | null;
  }>({ timestamp: 0, companyId: null });

const fetchTransactions = React.useCallback(async () => {
  setIsLoading(true);
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Authentication token not found.");

    const queryParam = selectedCompanyId
      ? `?companyId=${selectedCompanyId}`
      : "";

    lastFetchRef.current = {
      timestamp: Date.now(),
      companyId: selectedCompanyId,
    };

    const buildRequest = (url: string) =>
      fetch(url, { headers: { Authorization: `Bearer ${token}` } });

    console.log("Fetching sales with query:", queryParam);
    console.log("Selected company ID:", selectedCompanyId);

    // Response parsing utilities
    const parseResponse = (data: any, possibleArrayKeys: string[] = []) => {
      console.log("Parsing response:", data);
      
      if (Array.isArray(data)) return data;
      
      // Check for common success patterns
      if (data?.success && Array.isArray(data?.data)) return data.data;
      if (data?.success && Array.isArray(data?.entries)) return data.entries;
      
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
      return parseResponse(data, ['salesEntries', 'sales', 'entries']);
    };

    const parsePurchasesResponse = (data: any) => {
      return parseResponse(data, ['purchaseEntries', 'purchases', 'entries']);
    };

    const parseReceiptsResponse = (data: any) => {
      return parseResponse(data, ['receiptEntries', 'receipts', 'entries']);
    };

    const parsePaymentsResponse = (data: any) => {
      return parseResponse(data, ['paymentEntries', 'payments', 'entries']);
    };

    const parseJournalsResponse = (data: any) => {
      return parseResponse(data, ['journalEntries', 'journals', 'entries']);
    };

    const parseCompaniesResponse = (data: any) => {
      return parseResponse(data, ['companies', 'data']);
    };

    const parsePartiesResponse = (data: any) => {
      return parseResponse(data, ['parties', 'customers', 'data']);
    };

    const parseVendorsResponse = (data: any) => {
      return parseResponse(data, ['vendors', 'suppliers', 'data']);
    };

    const parseProductsResponse = (data: any) => {
      return parseResponse(data, ['products', 'items', 'data']);
    };

    const parseServicesResponse = (data: any) => {
      return parseResponse(data, ['services', 'data']);
    };

    // Helper function to check response status and parse JSON
    const fetchAndParse = async (url: string, parser: Function, endpointName: string) => {
      try {
        const response = await buildRequest(url);
        if (!response.ok) {
          throw new Error(`${endpointName} failed: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log(`${endpointName} response:`, data);
        return parser(data);
      } catch (error) {
        console.error(`Error fetching ${endpointName}:`, error);
        throw error;
      }
    };

    // Fetch all data with proper error handling
    const [
      salesArray,
      purchasesArray,
      receiptsArray,
      paymentsArray,
      journalsArray,
      companiesArray,
      partiesArray,
      vendorsArray,
      productsArray,
      servicesArray
    ] = await Promise.all([
      fetchAndParse(`${baseURL}/api/sales${queryParam}`, parseSalesResponse, 'sales'),
      fetchAndParse(`${baseURL}/api/purchase${queryParam}`, parsePurchasesResponse, 'purchases'),
      fetchAndParse(`${baseURL}/api/receipts${queryParam}`, parseReceiptsResponse, 'receipts'),
      fetchAndParse(`${baseURL}/api/payments${queryParam}`, parsePaymentsResponse, 'payments'),
      fetchAndParse(`${baseURL}/api/journals${queryParam}`, parseJournalsResponse, 'journals'),
      fetchAndParse(`${baseURL}/api/companies/my`, parseCompaniesResponse, 'companies'),
      fetchAndParse(`${baseURL}/api/parties`, parsePartiesResponse, 'parties'),
      fetchAndParse(`${baseURL}/api/vendors`, parseVendorsResponse, 'vendors'),
      fetchAndParse(`${baseURL}/api/products`, parseProductsResponse, 'products'),
      fetchAndParse(`${baseURL}/api/services`, parseServicesResponse, 'services')
    ]);

    console.log("Parsed sales:", salesArray);
    console.log("Parsed purchases:", purchasesArray);

    // Update state with parsed data
    setSales(salesArray.map((p: any) => ({ ...p, type: "sales" })));
    setPurchases(purchasesArray.map((p: any) => ({ ...p, type: "purchases" })));
    setReceipts(receiptsArray.map((r: any) => ({ ...r, type: "receipt" })));
    setPayments(paymentsArray.map((p: any) => ({ ...p, type: "payment" })));
    setJournals(journalsArray.map((j: any) => ({
      ...j,
      description: j.narration || j.description,
      type: "journal"
    })));
    
    setCompanies(companiesArray);
    setParties(partiesArray);
    setVendors(vendorsArray);
    setProductsList(productsArray);
    setServicesList(servicesArray);

  } catch (error) {
    console.error("Fetch transactions error:", error);
    toast({
      variant: "destructive",
      title: "Failed to load transactions",
      description: error instanceof Error ? error.message : "Something went wrong.",
    });
  } finally {
    setIsLoading(false);
  }
}, [selectedCompanyId, toast, baseURL]);

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
    let isMounted = true;

    const fetchData = async () => {
      await fetchTransactions();
    };

    fetchData();

    return () => {
      isMounted = false;
    };
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
      // Show a loading state while data is being fetched
      return (
        <Card>
          <CardContent className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      );
    }

    // Show the table only when the data is fully loaded
    return <DataTable columns={tableColumns} data={data} />;
  };

  React.useEffect(() => {
    console.log("Loading state:", isLoading);
    console.log("Companies count:", companies.length);
    console.log("Sales data:", sales);
    console.log("Purchases data:", purchases);
  }, [isLoading, companies.length, sales, purchases]);

  return (
    <div className="space-y-6">
      {isLoading ? (
        // Full-page loader while first fetch is in-flight
        <div className="h-[80vh] w-full flex items-center justify-center">
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="p-8 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      ) : companies.length === 0 ? (
        <div className="h-[80vh] w-full flex align-middle items-center justify-center">
          <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 shadow-lg overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                {/* Icon Section */}
                <div className="mb-5 w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-4 0H9m4 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v12m4 0V9m0 12h4m0 0V9m0 12h2"
                    ></path>
                  </svg>
                </div>

                {/* Text Content */}
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Company Setup Required
                </h3>
                <p className="text-gray-600 mb-5">
                  Contact us to enable your company account and access all
                  features.
                </p>

                {/* Call-to-Action Button */}
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <a className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      ></path>
                    </svg>
                    +91-8989773689
                  </a>

                  <a
                    href="mailto:support@company.com"
                    className="flex-1 border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      ></path>
                    </svg>
                    Email Us
                  </a>
                </div>

                {/* Support Hours */}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Transactions
              </h2>
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
                  This is a preview of the invoice. You can change the template
                  and download it as a PDF.
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
                      <TableHead className="hidden sm:table-cell">
                        Type
                      </TableHead>
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
        </>
      )}
    </div>
  );
}
