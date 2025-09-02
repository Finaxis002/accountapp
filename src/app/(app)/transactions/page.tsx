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
import { useUserPermissions } from "@/contexts/user-permissions-context";
import dynamic from 'next/dynamic';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
};

type TabKey =
  | "all"
  | "sales"
  | "purchases"
  | "receipts"
  | "payments"
  | "journals";
type FormType = "sales" | "purchases" | "receipt" | "payment" | "journal";

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
  const [activeTab, setActiveTab] = React.useState<TabKey>("all");
  const { selectedCompanyId } = useCompany();
  const getCompanyId = (c: any) => (typeof c === "object" ? c?._id : c) || null;

  const [defaultTransactionType, setDefaultTransactionType] = React.useState<
    "sales" | "purchases" | "receipt" | "payment" | "journal" | null
  >(null);

  const { toast } = useToast();

  // ---- PERMISSION GATING ----
  const { permissions: userCaps, role } = useUserPermissions(); // ensure your hook exposes role; otherwise get it from your auth context
  const isSuper = role === "master" || role === "client";

  const canSales = isSuper || !!userCaps?.canCreateSaleEntries;
  const canPurchases = isSuper || !!userCaps?.canCreatePurchaseEntries;
  const canReceipt = isSuper || !!userCaps?.canCreateReceiptEntries;
  const canPayment = isSuper || !!userCaps?.canCreatePaymentEntries;
  const canJournal = isSuper || !!userCaps?.canCreateJournalEntries;

  const allowedTypes = React.useMemo(() => {
    const arr: Array<
      "sales" | "purchases" | "receipt" | "payment" | "journal"
    > = [];
    if (canSales) arr.push("sales");
    if (canPurchases) arr.push("purchases");
    if (canReceipt) arr.push("receipt");
    if (canPayment) arr.push("payment");
    if (canJournal) arr.push("journal");
    return arr;
  }, [canSales, canPurchases, canReceipt, canPayment, canJournal]);

  const tabToFormType = (t: TabKey): FormType | null => {
    switch (t) {
      case "sales":
        return "sales";
      case "purchases":
        return "purchases";
      case "receipts":
        return "receipt";
      case "payments":
        return "payment";
      case "journals":
        return "journal";
      default:
        return null; // "all"
    }
  };

  const canCreateAny = allowedTypes.length > 0;

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

      // console.log("Fetching sales with query:", queryParam);
      // console.log("Selected company ID:", selectedCompanyId);

      // Response parsing utilities
      const parseResponse = (data: any, possibleArrayKeys: string[] = []) => {
        // console.log("Parsing response:", data);

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
        return parseResponse(data, ["salesEntries", "sales", "entries"]);
      };

      const parsePurchasesResponse = (data: any) => {
        return parseResponse(data, ["purchaseEntries", "purchases", "entries"]);
      };

      const parseReceiptsResponse = (data: any) => {
        return parseResponse(data, ["receiptEntries", "receipts", "entries"]);
      };

      const parsePaymentsResponse = (data: any) => {
        return parseResponse(data, ["paymentEntries", "payments", "entries"]);
      };

      const parseJournalsResponse = (data: any) => {
        return parseResponse(data, ["journalEntries", "journals", "entries"]);
      };

      const parseCompaniesResponse = (data: any) => {
        return parseResponse(data, ["companies", "data"]);
      };

      const parsePartiesResponse = (data: any) => {
        return parseResponse(data, ["parties", "customers", "data"]);
      };

      const parseVendorsResponse = (data: any) => {
        return parseResponse(data, ["vendors", "suppliers", "data"]);
      };

      const parseProductsResponse = (data: any) => {
        return parseResponse(data, ["products", "items", "data"]);
      };

      const parseServicesResponse = (data: any) => {
        return parseResponse(data, ["services", "data"]);
      };

      // Helper function to check response status and parse JSON
      const fetchAndParse = async (
        url: string,
        parser: Function,
        endpointName: string
      ) => {
        try {
          const response = await buildRequest(url);
          if (!response.ok) {
            throw new Error(
              `${endpointName} failed: ${response.status} ${response.statusText}`
            );
          }
          const data = await response.json();
          // console.log(`${endpointName} response:`, data);
          return parser(data);
        } catch (error) {
          console.error(`Error fetching ${endpointName}:`, error);
          throw error;
        }
      };

      // Fetch all data with proper error handling
      // tiny helper
      const maybeFetch = <T,>(
        cond: boolean,
        task: () => Promise<T>,
        fallback: T
      ) => (cond ? task() : Promise.resolve(fallback));

      // Fetch only allowed entry types; always fetch masters (companies/parties/products/services)
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
        servicesArray,
      ] = await Promise.all([
        maybeFetch(
          canSales,
          () =>
            fetchAndParse(
              `${baseURL}/api/sales${queryParam}`,
              parseSalesResponse,
              "sales"
            ),
          []
        ),
        maybeFetch(
          canPurchases,
          () =>
            fetchAndParse(
              `${baseURL}/api/purchase${queryParam}`,
              parsePurchasesResponse,
              "purchases"
            ),
          []
        ),
        maybeFetch(
          canReceipt,
          () =>
            fetchAndParse(
              `${baseURL}/api/receipts${queryParam}`,
              parseReceiptsResponse,
              "receipts"
            ),
          []
        ),
        maybeFetch(
          canPayment,
          () =>
            fetchAndParse(
              `${baseURL}/api/payments${queryParam}`,
              parsePaymentsResponse,
              "payments"
            ),
          []
        ),
        maybeFetch(
          canJournal,
          () =>
            fetchAndParse(
              `${baseURL}/api/journals${queryParam}`,
              parseJournalsResponse,
              "journals"
            ),
          []
        ),
        fetchAndParse(
          `${baseURL}/api/companies/my`,
          parseCompaniesResponse,
          "companies"
        ),
        fetchAndParse(
          `${baseURL}/api/parties`,
          parsePartiesResponse,
          "parties"
        ),
        fetchAndParse(
          `${baseURL}/api/vendors`,
          parseVendorsResponse,
          "vendors"
        ),
        fetchAndParse(
          `${baseURL}/api/products`,
          parseProductsResponse,
          "products"
        ),
        fetchAndParse(
          `${baseURL}/api/services`,
          parseServicesResponse,
          "services"
        ),
      ]);

      // console.log("Parsed sales:", salesArray);
      // console.log("Parsed purchases:", purchasesArray);

      // Update state with parsed data
      setSales(salesArray.map((p: any) => ({ ...p, type: "sales" })));
      setPurchases(
        purchasesArray.map((p: any) => ({ ...p, type: "purchases" }))
      );
      setReceipts(receiptsArray.map((r: any) => ({ ...r, type: "receipt" })));
      setPayments(paymentsArray.map((p: any) => ({ ...p, type: "payment" })));
      setJournals(
        journalsArray.map((j: any) => ({
          ...j,
          description: j.narration || j.description,
          type: "journal",
        }))
      );

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
        description:
          error instanceof Error ? error.message : "Something went wrong.",
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

  // console.log("serviceNameById  :", serviceNameById);
  // console.log("servicesList  :", servicesList);

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

  const handleOpenForm = (
    transaction: Transaction | null = null,
    type?: "sales" | "purchases" | "receipt" | "payment" | "journal"
  ) => {
    setTransactionToEdit(transaction);
    setDefaultTransactionType(type || null);
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

  async function handleSendInvoice(tx: Transaction) {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${baseURL}/api/sales/${tx._id}/send-invoice`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to send invoice");

      toast({
        title: "Invoice sent",
        description:
          typeof tx.party === "object" && tx.party?.email
            ? `Sent to ${tx.party.email}`
            : "Sent to customer’s email.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Send failed",
        description: e instanceof Error ? e.message : "Something went wrong.",
      });
    }
  }

  // --- Client-side company filters (defensive) ---
  const filteredSales = React.useMemo(
    () =>
      selectedCompanyId
        ? sales.filter((s) => getCompanyId(s.company) === selectedCompanyId)
        : sales,
    [sales, selectedCompanyId]
  );

  const filteredPurchases = React.useMemo(
    () =>
      selectedCompanyId
        ? purchases.filter((p) => getCompanyId(p.company) === selectedCompanyId)
        : purchases,
    [purchases, selectedCompanyId]
  );

  const filteredReceipts = React.useMemo(
    () =>
      selectedCompanyId
        ? receipts.filter((r) => getCompanyId(r.company) === selectedCompanyId)
        : receipts,
    [receipts, selectedCompanyId]
  );

  const filteredPayments = React.useMemo(
    () =>
      selectedCompanyId
        ? payments.filter((p) => getCompanyId(p.company) === selectedCompanyId)
        : payments,
    [payments, selectedCompanyId]
  );

  const filteredJournals = React.useMemo(
    () =>
      selectedCompanyId
        ? journals.filter((j) => getCompanyId(j.company) === selectedCompanyId)
        : journals,
    [journals, selectedCompanyId]
  );

  // Only show lists the user is allowed to see
  const visibleSales = canSales ? sales : [];
  const visiblePurchases = canPurchases ? purchases : [];
  const visibleReceipts = canReceipt ? receipts : [];
  const visiblePayments = canPayment ? payments : [];
  const visibleJournals = canJournal ? journals : [];

  const allVisibleTransactions = React.useMemo(
    () =>
      [
        ...visibleSales,
        ...visiblePurchases,
        ...visibleReceipts,
        ...visiblePayments,
        ...visibleJournals,
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [
      visibleSales,
      visiblePurchases,
      visibleReceipts,
      visiblePayments,
      visibleJournals,
    ]
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
      // onDownloadInvoice: handleDownloadInvoice,
      onDelete: handleOpenDeleteDialog,
      companyMap,
      serviceNameById, // Add this line
      onSendInvoice: handleSendInvoice,
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

  // React.useEffect(() => {
  //   console.log("Loading state:", isLoading);
  //   console.log("Companies count:", companies.length);
  //   console.log("Sales data:", sales);
  //   console.log("Purchases data:", purchases);
  // }, [isLoading, companies.length, sales, purchases]);

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
              {canCreateAny && (
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
                  <DialogContent wide className="  grid-rows-[auto,1fr,auto] max-h-[90vh] p-0 ]"  style={{ maxWidth: 1000, width: '125vw' }}>
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
                      defaultType={
                        defaultTransactionType ??
                        tabToFormType(activeTab) ??
                        allowedTypes[0] ??
                        "sales"
                      }
                      transaction={transactionToPreview}
                      company={
                        companies.find(
                          (c) => c._id === transactionToPreview?.company?._id
                        ) || null
                      }
                      party={
                        parties.find(
                          (p) =>
                            p._id ===
                              (transactionToPreview as any)?.party?._id ||
                            transactionToPreview?.party === p._id
                        ) || null
                      }
                      serviceNameById={serviceNameById} // ✅ pass it
                    />
                  </DialogContent>
                </Dialog>
              )}
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
                      p._id === (transactionToPreview as any)?.party?._id ||
                      transactionToPreview?.party === p._id
                  ) || null
                }
                serviceNameById={serviceNameById} // ✅ pass it
              />
            </DialogContent>
          </Dialog>

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

          {allowedTypes.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold">No transaction access</h3>
                <p className="text-sm text-muted-foreground">
                  You don’t have permission to view transaction entries. Please
                  contact your administrator.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as TabKey)}
            >
              <div className="overflow-x-auto pb-2">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  {canSales && <TabsTrigger value="sales">Sales</TabsTrigger>}
                  {canPurchases && (
                    <TabsTrigger value="purchases">Purchases</TabsTrigger>
                  )}
                  {canReceipt && (
                    <TabsTrigger value="receipts">Receipts</TabsTrigger>
                  )}
                  {canPayment && (
                    <TabsTrigger value="payments">Payments</TabsTrigger>
                  )}
                  {canJournal && (
                    <TabsTrigger value="journals">Journals</TabsTrigger>
                  )}
                </TabsList>
              </div>

              <TabsContent value="all" className="mt-4">
                {renderContent(allVisibleTransactions)}
              </TabsContent>

              {canSales && (
                <TabsContent value="sales" className="mt-4">
                  {renderContent(sales)}
                </TabsContent>
              )}

              {canPurchases && (
                <TabsContent value="purchases" className="mt-4">
                  {renderContent(purchases)}
                </TabsContent>
              )}

              {canReceipt && (
                <TabsContent value="receipts" className="mt-4">
                  {renderContent(receipts)}
                </TabsContent>
              )}

              {canPayment && (
                <TabsContent value="payments" className="mt-4">
                  {renderContent(payments)}
                </TabsContent>
              )}

              {canJournal && (
                <TabsContent value="journals" className="mt-4">
                  {renderContent(journals)}
                </TabsContent>
              )}
            </Tabs>
          )}
        </>
      )}
    </div>
  );
}
