"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "../ui/scroll-area";
import type {
  Company,
  Party,
  Product,
  Vendor,
  Transaction,
  Item,
  Service,
} from "@/lib/types";

import { Combobox } from "../ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { VendorForm } from "../vendors/vendor-form";
import { CustomerForm } from "../customers/customer-form";
import { useCompany } from "@/contexts/company-context";
import { ProductForm } from "../products/product-form";
import { Card, CardContent } from "../ui/card";
import { Separator } from "../ui/separator";
import { useUserPermissions } from "@/contexts/user-permissions-context";
import {
  generatePdfForTemplate3,
  generatePdfForTemplate1,
} from "@/lib/pdf-templates";
import { getUnifiedLines } from "@/lib/getUnifiedLines";

// reads gstin from various possible shapes/keys
const getCompanyGSTIN = (c?: Partial<Company> | null): string | null => {
  const x = c as any;
  return (
    x?.gstin ??
    x?.gstIn ??
    x?.gstNumber ??
    x?.gst_no ??
    x?.gst ??
    x?.gstinNumber ??
    x?.tax?.gstin ??
    null
  );
};

const unitTypes = [
  "Kg",
  "Litre",
  "Piece",
  "Box",
  "Meter",
  "Dozen",
  "Pack",
  "Other",
] as const;
const STANDARD_GST = 18; // default "Standard"
const GST_OPTIONS = [
  { label: "Standard (18%)", value: "18" },
  { label: "0%", value: "0" },
  { label: "5%", value: "5" },
  { label: "12%", value: "12" },

  { label: "28%", value: "28" },
] as const;

type StockItemInput = { product: string; quantity: number };

// ⬇️ Place this just above PRODUCT_DEFAULT
type ItemWithGST = {
  itemType: "product" | "service";
  product?: string;
  service?: string;
  quantity?: number;
  unitType?: (typeof unitTypes)[number];
  pricePerUnit?: number;
  description?: string;
  amount: number; // base excl. GST
  gstPercentage?: number; // per-line GST %
  lineTax?: number; // amount * gstPercentage/100
  lineTotal?: number; // amount + lineTax
};

const PRODUCT_DEFAULT = {
  itemType: "product" as const,
  product: "",
  quantity: 1,
  pricePerUnit: 0,
  unitType: "Piece" as const,
  amount: 0,
  gstPercentage: STANDARD_GST, // NEW
  lineTax: 0, // NEW
  lineTotal: 0,
};

const itemSchema = z
  .object({
    itemType: z.enum(["product", "service"]),
    product: z.string().optional(),
    service: z.string().optional(),
    quantity: z.coerce.number().optional(),
    unitType: z.enum(unitTypes).optional(),
    pricePerUnit: z.coerce.number().optional(),
    description: z.string().optional(),
    amount: z.coerce.number(),
    gstPercentage: z.coerce.number().min(0).max(100).optional(),
    lineTax: z.coerce.number().min(0).optional(),
    lineTotal: z.coerce.number().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    // Custom validations for products
    if (data.itemType === "product") {
      if (!data.product) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["product"],
          message: "Select a product",
        });
      }
      if (!data.quantity || data.quantity <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["quantity"],
          message: "Quantity must be > 0",
        });
      }
      if (data.pricePerUnit == null || data.pricePerUnit < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pricePerUnit"],
          message: "Price/Unit must be ≥ 0",
        });
      }
    }
  });

const formSchema = z
  .object({
    type: z.enum(["sales", "purchases", "receipt", "payment", "journal"]),
    company: z.string().min(1, "Please select a company."),
    party: z.string().optional(),
    date: z.date({ required_error: "A date is required." }),
    items: z.array(itemSchema).optional(),
    totalAmount: z.coerce
      .number()
      .positive("Amount must be a positive number.")
      .optional(), // Main amount for non-item transactions
    description: z.string().optional(),
    referenceNumber: z.string().optional(),
    fromAccount: z.string().optional(), // For Journal Debit
    toAccount: z.string().optional(), // For Journal Credit
    narration: z.string().optional(),
    paymentMethod: z.string().optional(),
    taxAmount: z.coerce.number().min(0).optional(), // <-- NEW (derived)
    invoiceTotal: z.coerce.number().min(0).optional(),
    subTotal: z.coerce.number().min(0).optional(),
    dontSendInvoice: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (["sales", "purchases", "receipt", "payment"].includes(data.type)) {
        return !!data.party;
      }
      return true;
    },
    {
      message: "This field is required for this transaction type.",
      path: ["party"],
    }
  )
  .refine(
    (data) => {
      if (data.type === "sales" || data.type === "purchases") {
        return data.items && data.items.length > 0;
      }
      return true;
    },
    {
      message: "At least one item is required for a sale or purchase.",
      path: ["items"],
    }
  )
  .refine(
    (data) => {
      if (data.type === "journal") {
        return !!data.fromAccount && !!data.toAccount;
      }
      return true;
    },
    {
      message: "Debit and Credit accounts are required for a journal entry.",
      path: ["fromAccount"], // Report error on one of the fields
    }
  );

interface TransactionFormProps {
  transactionToEdit?: Transaction | null;
  onFormSubmit: () => void;
  defaultType?: "sales" | "purchases" | "receipt" | "payment" | "journal"; // Add this
  serviceNameById: Map<string, string>;
  transaction: any;
  party: any;
  company: any;
}

export function TransactionForm({
  transactionToEdit,
  onFormSubmit,
  defaultType = "sales",
  serviceNameById,
  transaction,
  party,
  company,
}: TransactionFormProps) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isPartyDialogOpen, setIsPartyDialogOpen] = React.useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = React.useState(false);
  const [newEntityName, setNewEntityName] = React.useState("");
  const [isServiceDialogOpen, setIsServiceDialogOpen] = React.useState(false);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [parties, setParties] = React.useState<Party[]>([]);
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [services, setServices] = React.useState<Service[]>([]);
  const [balance, setBalance] = React.useState<number | null>(null);

  const [partyBalances, setPartyBalances] = React.useState<
    Record<string, number>
  >({});

  // which line (items[index]) is creating a product/service right now?
  const [creatingProductForIndex, setCreatingProductForIndex] = React.useState<
    number | null
  >(null);
  const [creatingServiceForIndex, setCreatingServiceForIndex] = React.useState<
    number | null
  >(null);

  const [isLoading, setIsLoading] = React.useState(true);
  const paymentMethods = ["Cash", "Credit", "UPI", "Bank Transfer"];

  const { selectedCompanyId } = useCompany();
  const { permissions: userCaps } = useUserPermissions();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange", // <— add this
    reValidateMode: "onChange", // <— and this
    defaultValues: {
      party: "",
      description: "",
      totalAmount: 0,
      items: [PRODUCT_DEFAULT],
      type: defaultType,
      referenceNumber: "",
      fromAccount: "",
      toAccount: "",
      narration: "",
      company: selectedCompanyId || "",
      date: new Date(),
      // gstRate: STANDARD_GST, // <-- NEW (Sales/Purchases will use this)
      taxAmount: 0, // <-- NEW
      invoiceTotal: 0,
    },
  });

  // which company is currently selected?
  const selectedCompanyIdWatch = useWatch({
    control: form.control,
    name: "company",
  });

  const selectedCompany = React.useMemo(
    () => companies.find((c) => c._id === selectedCompanyIdWatch),
    [companies, selectedCompanyIdWatch]
  );

  const companyGSTIN = React.useMemo(
    () => getCompanyGSTIN(selectedCompany),
    [selectedCompany]
  );

  const gstEnabled = !!(companyGSTIN && String(companyGSTIN).trim());

  const role = localStorage.getItem("role");
  const isSuper = role === "master" || role === "client";

  const canSales = isSuper || !!userCaps?.canCreateSaleEntries;
  const canPurchases = isSuper || !!userCaps?.canCreatePurchaseEntries;
  const canReceipt = isSuper || !!userCaps?.canCreateReceiptEntries;
  const canPayment = isSuper || !!userCaps?.canCreatePaymentEntries;
  const canJournal = isSuper || !!userCaps?.canCreateJournalEntries;

  // entity-create caps (single inventory flag)
  const canCreateCustomer = isSuper || !!userCaps?.canCreateCustomers;
  const canCreateVendor = isSuper || !!userCaps?.canCreateVendors;
  const canCreateInventory = isSuper || !!userCaps?.canCreateInventory;

  const allowedTypes = React.useMemo(() => {
    const arr: Array<z.infer<typeof formSchema>["type"]> = [];
    if (canSales) arr.push("sales");
    if (canPurchases) arr.push("purchases");
    if (canReceipt) arr.push("receipt");
    if (canPayment) arr.push("payment");
    if (canJournal) arr.push("journal");
    return arr;
  }, [canSales, canPurchases, canReceipt, canPayment, canJournal]);

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = useWatch({ control: form.control, name: "items" });
  const receiptAmountWatch = useWatch({
    control: form.control,
    name: "totalAmount",
  });

  const type = form.watch("type");

  // Derived flags for current tab
  const partyCreatable = React.useMemo(() => {
    if (type === "sales" || type === "receipt") return canCreateCustomer;
    if (type === "purchases" || type === "payment") return canCreateVendor;
    return false;
  }, [type, canCreateCustomer, canCreateVendor]);

  const serviceCreatable = canCreateInventory;

  // ADD THIS useEffect (keeps items only where they belong)
  React.useEffect(() => {
    if (type === "sales" || type === "purchases") {
      if (!form.getValues("items")?.length) {
        replace([PRODUCT_DEFAULT]);
      }
    } else {
      // receipt/payment/journal don't use items
      if (form.getValues("items")?.length) {
        replace([]);
      }
    }
  }, [type, replace, form]);

  // ⬇️ DROP-IN REPLACEMENT: per-line GST computation
  React.useEffect(() => {
    if (!watchedItems || !["sales", "purchases"].includes(type)) return;

    let subTotal = 0;
    let totalTax = 0;

    watchedItems.forEach((it, idx) => {
      let base = 0;

      if (it?.itemType === "product") {
        const q = Number(it.quantity) || 0;
        const p = Number(it.pricePerUnit) || 0;
        base = +(q * p).toFixed(2);

        const current = Number(form.getValues(`items.${idx}.amount`)) || 0;
        if (current !== base) {
          form.setValue(`items.${idx}.amount`, base, { shouldValidate: false });
        }
      } else if (it?.itemType === "service") {
        base = Number(it.amount) || 0;
      }

      subTotal += base;

      // Per-line GST Calculation
      const pct = gstEnabled ? Number(it?.gstPercentage ?? 18) : 0;

      const lineTax = +((base * pct) / 100).toFixed(2);
      const lineTotal = +(base + lineTax).toFixed(2);
      totalTax += lineTax;

      // Set the line values back to form only if they have changed
      const currentLineTax =
        Number(form.getValues(`items.${idx}.lineTax`)) || 0;
      const currentLineTotal =
        Number(form.getValues(`items.${idx}.lineTotal`)) || 0;

      if (currentLineTax !== lineTax) {
        form.setValue(`items.${idx}.lineTax`, lineTax, {
          shouldValidate: false,
        });
      }
      if (currentLineTotal !== lineTotal) {
        form.setValue(`items.${idx}.lineTotal`, lineTotal, {
          shouldValidate: false,
        });
      }
    });

    const invoiceTotal = +(subTotal + totalTax).toFixed(2);

    // Set the total values back to form only if they have changed
    if ((Number(form.getValues("totalAmount")) || 0) !== subTotal) {
      form.setValue("totalAmount", subTotal, { shouldValidate: true });
    }
    if ((Number(form.getValues("taxAmount")) || 0) !== totalTax) {
      form.setValue("taxAmount", totalTax, { shouldValidate: false });
    }
    if ((Number(form.getValues("invoiceTotal")) || 0) !== invoiceTotal) {
      form.setValue("invoiceTotal", invoiceTotal, { shouldValidate: false });
    }
  }, [watchedItems, type, gstEnabled, form]);

  // Try a bulk endpoint first; if not available, fall back to per-party calls
  const loadPartyBalances = React.useCallback(
    async (list: Party[]) => {
      const token = localStorage.getItem("token");
      if (!token || !Array.isArray(list) || list.length === 0) return;

      // 1) Try bulk endpoint: GET /api/parties/balances -> { balances: { [partyId]: number } }
      try {
        const bulk = await fetch(`${baseURL}/api/parties/balances`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (bulk.ok) {
          const data = await bulk.json();
          const map = (data && (data.balances as Record<string, number>)) || {};
          setPartyBalances(map);
          return; // done
        }
      } catch {
        // ignore and fall back
      }

      // 2) Fallback: GET /api/parties/:id/balance for each party
      // (kept simple; you can add throttling if your list is huge)
      const entries = await Promise.all(
        list.map(async (p) => {
          try {
            const r = await fetch(`${baseURL}/api/parties/${p._id}/balance`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!r.ok) return [p._id, 0] as const;
            const d = await r.json();
            return [p._id, Number(d?.balance ?? 0)] as const;
          } catch {
            return [p._id, 0] as const;
          }
        })
      );
      setPartyBalances(Object.fromEntries(entries));
    },
    [baseURL]
  );

  const fetchInitialData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const [companiesRes, partiesRes, productsRes, vendorsRes, servicesRes] =
        await Promise.all([
          fetch(`${baseURL}/api/companies/my`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${baseURL}/api/parties`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${baseURL}/api/products`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${baseURL}/api/vendors`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${baseURL}/api/services`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      if (
        !companiesRes.ok ||
        !partiesRes.ok ||
        !productsRes.ok ||
        !vendorsRes.ok ||
        !servicesRes.ok
      ) {
        throw new Error("Failed to fetch initial form data.");
      }

      const companiesData = await companiesRes.json();
      const partiesData = await partiesRes.json();
      const productsData = await productsRes.json();
      const vendorsData = await vendorsRes.json();
      const servicesData = await servicesRes.json();

      setCompanies(companiesData);
      setParties(
        Array.isArray(partiesData) ? partiesData : partiesData.parties || []
      );

      const list: Party[] = Array.isArray(partiesData)
        ? partiesData
        : partiesData.parties || [];

      const listHasInlineBalance =
        Array.isArray(list) &&
        list.some((p: any) => typeof p?.balance === "number");

      if (!listHasInlineBalance) {
        // fetch balances if not already present on party objects
        loadPartyBalances(list);
      } else {
        // use inline balances directly to build the map for quick lookup
        const map: Record<string, number> = {};
        list.forEach((p: any) => (map[p._id] = Number(p.balance || 0)));
        setPartyBalances(map);
      }
      setProducts(
        Array.isArray(productsData) ? productsData : productsData.products || []
      );
      setServices(
        Array.isArray(servicesData) ? servicesData : servicesData.services || []
      );
      setVendors(
        Array.isArray(vendorsData) ? vendorsData : vendorsData.vendors || []
      );

      if (companiesData.length > 0 && !transactionToEdit) {
        // Use the context-based selected company if available, otherwise default to first.
        form.setValue("company", selectedCompanyId || companiesData[0]._id);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load data",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, form, transactionToEdit, selectedCompanyId]);

  React.useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  React.useEffect(() => {
    if (!transactionToEdit) return;

    // ---------- helpers ----------
    const toProductItem = (p: any) => ({
      itemType: "product" as const,
      product:
        typeof p.product === "object"
          ? String(p.product._id)
          : String(p.product || ""),
      quantity: p.quantity ?? 1,
      unitType: p.unitType ?? "Piece",
      pricePerUnit: p.pricePerUnit ?? 0,
      description: p.description ?? "",
      amount:
        typeof p.amount === "number"
          ? p.amount
          : Number(p.quantity || 0) * Number(p.pricePerUnit || 0),
      gstPercentage: p.gstPercentage ?? 18, // Ensure GST is set
      lineTax: p.lineTax ?? 0, // Ensure lineTax is set
      lineTotal: p.lineTotal ?? p.amount, // Ensure lineTotal is set correctly
    });

    const toServiceId = (s: any) => {
      // handle both new and legacy shapes
      const raw =
        (s.service &&
          (typeof s.service === "object" ? s.service._id : s.service)) ??
        (s.serviceName &&
          (typeof s.serviceName === "object"
            ? s.serviceName._id
            : s.serviceName));

      return raw ? String(raw) : "";
    };

   const toServiceItem = (s: any) => ({
  itemType: "service" as const,
  service: toServiceId(s),
  description: s.description ?? "",
  amount: Number(s.amount || 0),
  gstPercentage: s.gstPercentage ?? 18, // Ensure GST is included for services
  lineTax: s.lineTax ?? 0, // Ensure lineTax is set for services
  lineTotal: s.lineTotal ?? s.amount, // Ensure lineTotal is set correctly for services
});


   const toUnifiedItem = (i: any) => ({
  itemType:
    (i.itemType as "product" | "service") ??
    (i.product || i.productId ? "product" : "service"),
  product:
    typeof i.product === "object"
      ? String(i.product._id)
      : String(i.product || ""),
  service: toServiceId(i),
  quantity: i.quantity ?? (i.itemType === "service" ? undefined : 1),
  unitType: i.unitType ?? "Piece",
  pricePerUnit: i.pricePerUnit ?? undefined,
  description: i.description ?? "",
  amount:
    typeof i.amount === "number"
      ? i.amount
      : Number(i.quantity || 0) * Number(i.pricePerUnit || 0),
  gstPercentage: i.gstPercentage ?? 18, // Ensure GST is set for both products and services
  lineTax: i.lineTax ?? 0, // Ensure lineTax is set
  lineTotal: i.lineTotal ?? i.amount, // Ensure lineTotal is set correctly
});


    // ---------- choose source ----------
    let itemsToSet: any[] = [];

    // 1) New unified shape already on the doc
    if (
      Array.isArray((transactionToEdit as any).items) &&
      (transactionToEdit as any).items.length
    ) {
      itemsToSet = (transactionToEdit as any).items.map(toUnifiedItem);
    } else {
      // 2) Legacy/new arrays
      const prodArr = Array.isArray((transactionToEdit as any).products)
        ? (transactionToEdit as any).products.map(toProductItem)
        : [];

      // NEW: read plural `services`
      const svcPlural = Array.isArray((transactionToEdit as any).services)
        ? (transactionToEdit as any).services.map(toServiceItem)
        : [];

      // Legacy: some data used `service` (singular)
      const svcLegacy = Array.isArray((transactionToEdit as any).service)
        ? (transactionToEdit as any).service.map(toServiceItem)
        : [];

      itemsToSet = [...prodArr, ...svcPlural, ...svcLegacy];
    }

    // sales/purchases need at least one row
    if (
      (!itemsToSet || itemsToSet.length === 0) &&
      (transactionToEdit.type === "sales" ||
        transactionToEdit.type === "purchases")
    ) {
      itemsToSet = [
        {
          itemType: "product" as const,
          product: "",
          quantity: 1,
          pricePerUnit: 0,
          unitType: "Piece",
          amount: 0,
          description: "",
        },
      ];
    }

    // party/vendor id
    let partyId: string | undefined;
    if ((transactionToEdit as any).party) {
      partyId =
        typeof (transactionToEdit as any).party === "object"
          ? (transactionToEdit as any).party._id
          : (transactionToEdit as any).party;
    } else if ((transactionToEdit as any).vendor) {
      partyId =
        typeof (transactionToEdit as any).vendor === "object"
          ? (transactionToEdit as any).vendor._id
          : (transactionToEdit as any).vendor;
    }

    // reset the form with normalized items
    form.reset({
      type: transactionToEdit.type,
      company:
        typeof transactionToEdit.company === "object"
          ? transactionToEdit.company._id
          : (transactionToEdit.company as any),
      date: new Date(transactionToEdit.date),
      totalAmount:
        transactionToEdit.totalAmount || (transactionToEdit as any).amount,
      items: itemsToSet,
      description: transactionToEdit.description || "",
      narration: (transactionToEdit as any).narration || "",
      party: partyId,
      referenceNumber: (transactionToEdit as any).referenceNumber,
      fromAccount: (transactionToEdit as any).debitAccount,
      toAccount: (transactionToEdit as any).creditAccount,
    });

    replace(itemsToSet);
  }, [transactionToEdit, form, replace]);

  React.useEffect(() => {
    if (transactionToEdit) return; // don't change type while editing
    const current = form.getValues("type");
    if (!allowedTypes.includes(current)) {
      form.setValue("type", allowedTypes[0] ?? "sales");
    }
  }, [allowedTypes, transactionToEdit, form]);

  // async function updateStock(token: string, items: Item[]) {
  async function updateStock(token: string, items: StockItemInput[]) {
    try {
      const res = await fetch(`${baseURL}/api/products/update-stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update stock levels.");
      }
    } catch (error) {
      console.error("Stock update failed:", error);
      
      toast({
        variant: "destructive",
        title: "Stock Update Failed",
        description:
          "Transaction was saved, but failed to update inventory stock levels.",
      });
    }
  }

  // Add this helper function
  const enrichTransactionWithNames = (
    transaction: any,
    products: Product[],
    services: Service[]
  ) => {
    if (!transaction) return transaction;

    const enriched = { ...transaction };

    // Enrich products
    if (Array.isArray(enriched.products)) {
      enriched.products = enriched.products.map((productItem: any) => {
        const product = products.find((p) => p._id === productItem.product);
        return {
          ...productItem,
          productName: product?.name || "Unknown Product",
          product: product
            ? { ...product, name: product.name }
            : productItem.product,
        };
      });
    }

    // Enrich services
    if (Array.isArray(enriched.services)) {
      enriched.services = enriched.services.map((serviceItem: any) => {
        const service = services.find((s) => s._id === serviceItem.service);
        return {
          ...serviceItem,
          serviceName: service?.serviceName || "Unknown Service",
          service: service
            ? { ...service, serviceName: service.serviceName }
            : serviceItem.service,
        };
      });
    }

    return enriched;
  };

  // Put this near your onSubmit (or in a util)
  function buildInvoiceEmailHTML(opts: {
    companyName: string;
    partyName?: string | null;
    supportEmail?: string | null;
    supportPhone?: string | null;
    logoUrl?: string | null; // optional if you store one
  }) {
    const {
      companyName,
      partyName = "Customer",
      supportEmail = "",
      supportPhone = "",
      logoUrl,
    } = opts;

    const contactLine = supportEmail
      ? `for any queries, feel free to contact us at <a href="mailto:${supportEmail}" style="color:#2563eb;text-decoration:none;">${supportEmail}</a>${
          supportPhone ? ` or ${supportPhone}` : ""
        }.`
      : `for any queries, feel free to contact us${
          supportPhone ? ` at ${supportPhone}` : ""
        }.`;

    return `
  <table role="presentation" width="100%" style="background:#f5f7fb;padding:24px 12px;margin:0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
          <tr>
            <td style="background:#111827;color:#fff;padding:16px 24px;">
              <div style="display:flex;align-items:center;gap:12px;">
                ${
                  logoUrl
                    ? `<img src="${logoUrl}" alt="${companyName}" width="32" height="32" style="border-radius:6px;display:inline-block;">`
                    : ``
                }
                <span style="font-size:18px;font-weight:700;letter-spacing:.3px;">${companyName}</span>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 24px 8px;">
              <p style="margin:0 0 12px 0;font-size:16px;color:#111827;">Dear ${partyName},</p>
              <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#374151;">
                Thank you for choosing ${companyName}. Please find attached the invoice for your recent purchase.
                We appreciate your business and look forward to serving you again.
              </p>

              <div style="margin:18px 0;padding:14px 16px;border:1px solid #e5e7eb;background:#f9fafb;border-radius:10px;font-size:14px;color:#111827;">
                Your invoice is attached as a PDF.
              </div>

              <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#374151;">
                ${contactLine}
              </p>

              <p style="margin:24px 0 0 0;font-size:14px;color:#111827;">
                Warm regards,<br>
                <strong>${companyName}</strong><br>
                ${
                  supportEmail
                    ? `<a href="mailto:${supportEmail}" style="color:#2563eb;text-decoration:none;">${supportEmail}</a>`
                    : ``
                }
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#f9fafb;color:#6b7280;font-size:12px;text-align:center;padding:12px 24px;border-top:1px solid #e5e7eb;">
              This is an automated message regarding your invoice. Please reply to the address above if you need help.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const endpointMap: Record<string, string> = {
        sales: `/api/sales`,
        purchases: `/api/purchase`,
        receipt: `/api/receipts`,
        payment: `/api/payments`,
        journal: `/api/journals`,
      };

      const method = transactionToEdit ? "PUT" : "POST";
      let endpoint = endpointMap[values.type];

      if (transactionToEdit) {
        const editType = transactionToEdit.type; // use original type for endpoint
        endpoint = `${endpointMap[editType]}/${transactionToEdit._id}`;
      }

      // --- Build line items ---
      const productLines =
        values.items
          ?.filter((i) => i.itemType === "product")
          .map((i) => ({
            product: i.product, // ObjectId
            quantity: i.quantity,
            unitType: i.unitType,
            pricePerUnit: i.pricePerUnit,
            amount:
              typeof i.amount === "number"
                ? i.amount
                : Number(i.quantity || 0) * Number(i.pricePerUnit || 0),
            description: i.description ?? "",
            gstPercentage: gstEnabled ? Number(i.gstPercentage ?? 18) : 0,
            lineTax: gstEnabled ? Number(i.lineTax ?? 0) : 0,
            lineTotal: gstEnabled ? Number(i.lineTotal ?? i.amount) : i.amount,
          })) ?? [];

      const serviceLines =
        values.items
          ?.filter((i) => i.itemType === "service")
          .map((i) => ({
            service: i.service, // ✅ send id under "service"
            amount: i.amount,
            description: i.description ?? "",
            gstPercentage: gstEnabled ? Number(i.gstPercentage ?? 18) : 0,
            lineTax: gstEnabled ? Number(i.lineTax ?? 0) : 0,
            lineTotal: gstEnabled ? Number(i.lineTotal ?? i.amount) : i.amount,
          })) ?? [];

      // --- Totals coming from UI ---
      const uiSubTotal = Number(values.totalAmount ?? 0);

      // if GST disabled, force tax=0 and total=subtotal
      const uiTax = gstEnabled ? Number(values.taxAmount ?? 0) : 0;
      const uiInvoiceTotal = gstEnabled
        ? Number(values.invoiceTotal ?? uiSubTotal)
        : uiSubTotal;
      const receiptAmount = Number(
        values.totalAmount ?? values.subTotal ?? values.invoiceTotal ?? 0
      );

      // --- Build payload ---
      let payload: any;

      if (values.type === "receipt") {
        // ✅ validate on client to avoid 400 from API
        // if (!(receiptAmount > 0)) {
        //   setIsSubmitting(false);
        //   toast({
        //     variant: "destructive",
        //     title: "Amount required",
        //     description: "Enter a receipt amount greater than 0.",
        //   });
        //   return;
        // }

        // ✅ send the exact shape your backend expects
        payload = {
          type: "receipt",
          company: values.company,
          party: values.party,
          date: values.date,
          amount: receiptAmount, // <-- important
          description: values.description,
          referenceNumber: values.referenceNumber,
        };
      } else {
        // (unchanged for sales/purchases/payment/journal except for the block below)
        payload = {
          type: values.type,
          company: values.company,
          party: values.party,
          date: values.date,
          description: values.description,
          referenceNumber: values.referenceNumber,
          narration: values.narration,
          products: productLines,
          services: serviceLines,
          totalAmount: uiInvoiceTotal,
          subTotal: uiSubTotal,
          taxAmount: uiTax,
          paymentMethod: values.paymentMethod,
          invoiceTotal: uiInvoiceTotal,
        };
      }

      // Clean up fields not needed by the server
      delete (payload as any).items;
      delete (payload as any).gstRate;

      // Role-based payload tweaks
      if (values.type === "purchases" || values.type === "payment") {
        payload.vendor = values.party;
        delete payload.party;
      }

      if (values.type === "journal") {
        payload.debitAccount = values.fromAccount;
        payload.creditAccount = values.toAccount;
        payload.amount = Number(values.totalAmount ?? 0);

        delete payload.fromAccount;
        delete payload.toAccount;
        delete payload.party;
        delete payload.products;
        delete payload.services;
        delete payload.referenceNumber;
        delete payload.subTotal;
        delete payload.taxAmount;
        delete payload.invoiceTotal;
        delete payload.gstPercentage;
        delete payload.totalAmount;
      }

      const res = await fetch(`${baseURL}${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || `Failed to submit ${values.type} entry.`
        );
      }

      // If it's a sale and was successful, update stock
      if (values.type === "sales" && productLines.length) {
        await updateStock(
          token,
          productLines.map((p) => ({
            product: p.product!,
            quantity: Number(p.quantity) || 0,
          }))
        );
      }

      // 🔽 SEND INVOICE PDF BY EMAIL (Sales only)
      if (values.type === "sales") {
        if (values.dontSendInvoice) {
          toast({
            title: "Invoice will not be sent",
            description: "You have selected not to send the invoice.",
          });
        } else {
          const saved = data?.entry || data?.sale || {};
          const savedCompanyId = String(
            saved.company?._id || saved.company || values.company
          );
          const savedPartyId = String(
            saved.party?._id || saved.party || values.party
          );

          const companyDoc = companies.find(
            (c) => String(c._id) === savedCompanyId
          );
          const partyDoc = parties.find((p) => String(p._id) === savedPartyId);

          if (partyDoc?.email) {
            let pdfDoc;
            try {
              const enrichedTransaction = enrichTransactionWithNames(
                saved,
                products,
                services
              );
              pdfDoc = generatePdfForTemplate1(
                enrichedTransaction,
                companyDoc as any,
                partyDoc as any,
                serviceNameById // This is the missing argument
              );
            } catch (error) {
              console.error(
                "Template 3 failed, falling back to Template 1:",
                error
              );
              const enrichedTransaction = enrichTransactionWithNames(
                saved,
                products,
                services
              );
              pdfDoc = generatePdfForTemplate3(
                enrichedTransaction,
                companyDoc as any,
                partyDoc as any,
                serviceNameById // This is the missing argument
              );
            }

            const pdfInstance = await pdfDoc;
            const pdfBase64 = pdfInstance.output("datauristring").split(",")[1];

            const subject = `Invoice From ${
              companyDoc?.businessName ?? "Your Company"
            }`;
            const bodyHtml = buildInvoiceEmailHTML({
              companyName: companyDoc?.businessName ?? "Your Company",
              partyName: partyDoc?.name ?? "Customer",
              supportEmail: companyDoc?.emailId ?? "",
              supportPhone: companyDoc?.mobileNumber ?? "",
            });

            const fileName = `${
              saved.invoiceNumber ?? saved.referenceNumber ?? "invoice"
            }.pdf`;

            const emailRes = await fetch(
              `${baseURL}/api/integrations/gmail/send-invoice`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  to: partyDoc.email,
                  subject,
                  html: bodyHtml,
                  fileName,
                  pdfBase64,
                  companyId: savedCompanyId,
                  sendAs: "companyOwner",
                }),
              }
            );

            if (!emailRes.ok) {
              const eData = await emailRes.json().catch(() => ({}));
              toast({
                variant: "destructive",
                title: "Invoice email not sent",
                description: eData.message || "Failed to send invoice email.",
              });
            } else {
              toast({
                title: "Invoice emailed",
                description: `Sent to ${partyDoc.email}`,
              });
            }
          } else {
            toast({
              variant: "destructive",
              title: "No customer email",
              description:
                "The selected customer does not have an email address.",
            });
          }
        }
      }

      const inv = data?.entry?.invoiceNumber;
      toast({
        title: `Transaction ${transactionToEdit ? "Updated" : "Submitted"}!`,
        description: inv
          ? `Your ${values.type} entry has been recorded. Invoice #${inv}.`
          : `Your ${values.type} entry has been recorded.`,
      });

      onFormSubmit();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleTriggerCreateParty = (name: string) => {
    const needCustomer = type === "sales" || type === "receipt";
    const allowed = needCustomer ? canCreateCustomer : canCreateVendor;
    if (!allowed) {
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: needCustomer
          ? "You don't have permission to create customers."
          : "You don't have permission to create vendors.",
      });
      return;
    }
    setNewEntityName(name);
    setIsPartyDialogOpen(true);
  };

  const handlePartyCreated = (newEntity: Party | Vendor) => {
    const entityId = newEntity._id;
    const entityName = newEntity.name || newEntity.vendorName;

    if (["sales", "receipt"].includes(form.getValues("type"))) {
      setParties((prev) => [
        ...(Array.isArray(prev) ? prev : []),
        newEntity as Party,
      ]);
    } else {
      setVendors((prev) => [
        ...(Array.isArray(prev) ? prev : []),
        newEntity as Vendor,
      ]);
    }

    form.setValue("party", entityId, { shouldValidate: true });
    toast({
      title: `New ${
        ["sales", "receipt"].includes(form.getValues("type"))
          ? "Customer"
          : "Vendor"
      } Created`,
      description: `${entityName} has been added.`,
    });
    setIsPartyDialogOpen(false);
  };

  // remaining balance to display live in receipt tab
  // const remainingAfterReceipt =
  //   balance != null && type === "receipt"
  //     ? Math.max(0, Number(balance) - Number(receiptAmountWatch || 0))
  //     : null;

  const handlePartyChange = async (partyId: string) => {
    if (!partyId) return;

    try {
      const token = localStorage.getItem("token"); // Get the token from localStorage or wherever it's stored
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await fetch(
        `${baseURL}/api/parties/${partyId}/balance`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in the Authorization header
          },
        }
      );
      const data = await response.json();

      if (response.ok) {
        setBalance(data.balance); // Set the balance in state
        form.setValue("totalAmount", 0, { shouldValidate: true }); // reset amount on new party
      } else {
        setBalance(null);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch balance.",
        });
      }
    } catch (error) {
      setBalance(null);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch balance.",
      });
    }
  };

  const handleTriggerCreateProduct = (name: string) => {
    setNewEntityName(name); // Store the name in state
    setIsProductDialogOpen(true);
  };

  const handleTriggerCreateService = async (name: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const res = await fetch(`${baseURL}/api/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ serviceName: name }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create service.");
      }

      handleServiceCreated(data.service || data);
      return data.service?._id || data._id; // Return the new service ID
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Service Creation Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
      return null;
    }
  };

  const handleProductCreated = (newProduct: Product) => {
    setProducts((prev) => [...prev, newProduct]);

    // ⬇️ NEW: auto-select on the row that initiated creation
    if (creatingProductForIndex !== null) {
      form.setValue(
        `items.${creatingProductForIndex}.product`,
        newProduct._id,
        { shouldValidate: true, shouldDirty: true }
      );
      // ensure the row is a product row (defensive)
      form.setValue(`items.${creatingProductForIndex}.itemType`, "product", {
        shouldValidate: false,
      });
    }
    setCreatingProductForIndex(null);

    toast({
      title: "Product Created",
      description: `${newProduct.name} has been added.`,
    });
    setIsProductDialogOpen(false);
  };

  const handleServiceCreated = (newService: Service) => {
    setServices((prev) => [...prev, newService]);

    // ⬇️ NEW: auto-select on the row that initiated creation
    if (creatingServiceForIndex !== null) {
      form.setValue(
        `items.${creatingServiceForIndex}.service`,
        newService._id,
        { shouldValidate: true, shouldDirty: true }
      );
      form.setValue(`items.${creatingServiceForIndex}.itemType`, "service", {
        shouldValidate: false,
      });
    }
    setCreatingServiceForIndex(null);

    toast({
      title: "Service Created",
      description: `${newService.serviceName} has been added.`,
    });
    setIsServiceDialogOpen(false);
  };

  const getPartyOptions = () => {
    if (type === "sales" || type === "receipt") {
    // All parties (customers) – no filter for balance
    const source = parties;

    // For RECEIPT, show all customers regardless of balance
    return source.map((p) => ({
      value: p._id,
      label: String(p.name || ""),
    }));
  }


    if (type === "purchases" || type === "payment") {
      // vendors (unchanged)
      return vendors.map((v) => ({
        value: v._id,
        label: String(v.vendorName || ""),
      }));
    }

    return [];
  };

  const getPartyLabel = () => {
    switch (type) {
      case "sales":
        return "Customer Name";
      case "purchases":
        return "Vendor Name";
      case "receipt":
        return "Received From";
      case "payment":
        return "Paid To";
      default:
        return "Party";
    }
  };

  const partyOptions = getPartyOptions();
  const partyLabel = getPartyLabel();

  const productOptions = products.map((p) => ({ value: p._id, label: p.name }));
  // CONFIRM this code exists:
  const serviceOptions = services.map((s) => ({
    value: s._id,
    label: s.serviceName,
  }));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-4">Loading form data...</p>
      </div>
    );
  }

  // Must have at least one transaction-create permission AND at least one entity-create permission.
  const hasAnyTxnCreate =
    canSales || canPurchases || canReceipt || canPayment || canJournal;

  const hasAnyEntityCreate =
    canCreateCustomer || canCreateVendor || canCreateInventory;

  const canOpenForm =
    isSuper || !!transactionToEdit || (hasAnyTxnCreate && hasAnyEntityCreate);

  if (!canOpenForm) {
    return (
      <div className="p-6">
        <Card className="max-w-xl mx-auto">
          <CardContent className="p-6 space-y-3">
            <h2 className="text-lg font-semibold">Access denied</h2>
            <p className="text-sm text-muted-foreground">
              Your admin hasn’t granted you the permissions required to create
              transactions here.
            </p>
            <ul className="text-sm list-disc pl-5 space-y-1">
              {!hasAnyTxnCreate && (
                <li>
                  You lack permission to create
                  Sales/Purchases/Receipt/Payment/Journal.
                </li>
              )}
              {!hasAnyEntityCreate && (
                <li>
                  You lack permission to create Customers, Vendors, or Inventory
                  (Products/Services).
                </li>
              )}
            </ul>
            <p className="text-sm text-muted-foreground">
              Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderSalesPurchasesFields = () => (
    <div className="space-y-4">
      {/* Core Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.businessName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Transaction Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="party"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{partyLabel}</FormLabel>
            <Combobox
              options={partyOptions}
              value={field.value || ""}
              // onChange={field.onChange}
              onChange={(value) => {
                field.onChange(value);
                handlePartyChange(value); // Fetch balance when party is selected
              }}
              placeholder="Select or create..."
              searchPlaceholder="Search..."
              noResultsText="No results found."
              creatable={partyCreatable} // ⬅️ was always true
              onCreate={async (name) => {
                if (!partyCreatable) {
                  toast({
                    variant: "destructive",
                    title: "Permission denied",
                    description:
                      type === "sales" || type === "receipt"
                        ? "You don't have permission to create customers."
                        : "You don't have permission to create vendors.",
                  });
                  return ""; // do NOT open dialog
                }
                handleTriggerCreateParty(name); // ⬅️ only when allowed
                return "";
              }}
            />

            <FormMessage />
            {/* Display balance if available */}
            {balance !== null && (
              <div className="text-red-500 text-sm mt-2">
                Balance: ₹{balance.toFixed(2)}
              </div>
            )}
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="paymentMethod"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Payment Method</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select Payment Method" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />

      {/* Items Array */}
      <div className="space-y-4">
        <h3 className="text-base font-medium">Items & Services</h3>
        {fields.map((item, index) => (
          <Card key={item.id} className="relative">
            <CardContent className="p-4 space-y-4">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => remove(index)}
                disabled={fields.length <= 1}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>

              {item.itemType === "product" ? (
                <>
                  {/* Product Selection */}
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
                    <FormField
                      control={form.control}
                      name={`items.${index}.product`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-2 text-blue-500"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Product Selection
                          </FormLabel>
                          <Combobox
                            options={productOptions}
                            value={field.value || ""}
                            onChange={(value) => field.onChange(value)}
                            placeholder="Select or create a product..."
                            searchPlaceholder="Search products..."
                            noResultsText="No product found."
                            creatable
                            onCreate={async (name) => {
                              setCreatingProductForIndex(index);
                              handleTriggerCreateProduct(name);
                              return "";
                            }}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Product Details - Compact Grid */}
                  {/* Product Details - Single Row Layout */}
                  <div className="flex flex-wrap items-end gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    {/* Quantity */}
                    <div className="min-w-[80px] flex-1">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              Qty
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="h-9 text-sm px-2 tabular-nums bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                type="number"
                                min="0"
                                placeholder="1"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? ""
                                      : e.target.valueAsNumber
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Unit */}
                    <div className="min-w-[100px] flex-1">
                      <FormField
                        control={form.control}
                        name={`items.${index}.unitType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              Unit
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-9 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500">
                                  <SelectValue placeholder="Unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {unitTypes.map((u) => (
                                  <SelectItem
                                    key={u}
                                    value={u}
                                    className="text-sm"
                                  >
                                    {u}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Price/Unit */}
                    <div className="min-w-[120px] flex-1">
                      <FormField
                        control={form.control}
                        name={`items.${index}.pricePerUnit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              Price/Unit
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="h-9 text-sm px-2 tabular-nums text-right bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? ""
                                      : e.target.valueAsNumber
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Amount */}
                    <div className="min-w-[120px] flex-1">
                      <FormField
                        control={form.control}
                        name={`items.${index}.amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              Amount
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="h-9 text-sm px-2 tabular-nums text-right bg-gray-100 dark:bg-gray-700/70 border-gray-200 dark:border-gray-600 font-medium"
                                type="number"
                                readOnly
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* GST % */}
                    {gstEnabled && (
                      <>
                        <div className="min-w-[100px] flex-1">
                          <FormField
                            control={form.control}
                            name={`items.${index}.gstPercentage`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  GST %
                                </FormLabel>
                                <Select
                                  disabled={!gstEnabled}
                                  value={String(field.value ?? 18)}
                                  onValueChange={(v) =>
                                    field.onChange(Number(v))
                                  }
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-9 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500">
                                      <SelectValue placeholder="GST %" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {GST_OPTIONS.map((opt) => (
                                      <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                        className="text-sm"
                                      >
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Line Tax */}
                        <div className="min-w-[100px] flex-1">
                          <FormField
                            control={form.control}
                            name={`items.${index}.lineTax`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Tax
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    className="h-9 text-sm px-2 tabular-nums text-right bg-gray-100 dark:bg-gray-700/70 border-gray-200 dark:border-gray-600 font-medium"
                                    type="number"
                                    readOnly
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Line Total */}
                        <div className="min-w-[120px] flex-1">
                          <FormField
                            control={form.control}
                            name={`items.${index}.lineTotal`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Total
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    className="h-9 text-sm px-2 tabular-nums text-right bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800/50 font-medium text-blue-700 dark:text-blue-300"
                                    type="number"
                                    readOnly
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                /* Service Card */
                <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800/50">
                  {/* Service Selection */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.service`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-2 text-green-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Service Selection
                        </FormLabel>
                        <Combobox
                          options={serviceOptions}
                          value={field.value || ""}
                          onChange={(value) => field.onChange(value)}
                          placeholder="Select or create a service..."
                          searchPlaceholder="Search services..."
                          noResultsText="No service found."
                          creatable={serviceCreatable}
                          onCreate={async (name) => {
                            if (!serviceCreatable) {
                              toast({
                                variant: "destructive",
                                title: "Permission denied",
                                description:
                                  "You don't have permission to create inventory.",
                              });
                              return "";
                            }

                            setCreatingServiceForIndex(index);
                            const newServiceId =
                              await handleTriggerCreateService(name);

                            if (newServiceId) {
                              form.setValue(
                                `items.${index}.service`,
                                newServiceId,
                                { shouldValidate: true, shouldDirty: true }
                              );
                              form.setValue(
                                `items.${index}.itemType`,
                                "service",
                                { shouldValidate: false }
                              );
                              return newServiceId;
                            }

                            return "";
                          }}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Service Details */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    {/* Amount */}
                    <div className="md:col-span-3">
                      <FormField
                        control={form.control}
                        name={`items.${index}.amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              Amount
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="h-9 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? ""
                                      : e.target.valueAsNumber
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              Description
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="h-9 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Service description"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {gstEnabled && (
                      <>
                        {/* GST % */}
                        <div className="md:col-span-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.gstPercentage`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  GST %
                                </FormLabel>
                                <Select
                                  disabled={!gstEnabled}
                                  value={String(field.value ?? 18)}
                                  onValueChange={(v) =>
                                    field.onChange(Number(v))
                                  }
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-9 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500">
                                      <SelectValue placeholder="GST %" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {GST_OPTIONS.map((opt) => (
                                      <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                        className="text-sm"
                                      >
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Line Tax */}
                        <div className="md:col-span-1">
                          <FormField
                            control={form.control}
                            name={`items.${index}.lineTax`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Tax
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    className="h-9 px-1 text-sm text-right bg-gray-100 dark:bg-gray-700/70 border-gray-200 dark:border-gray-600 font-medium"
                                    type="number"
                                    readOnly
                                    value={field.value ?? 0}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Line Total */}
                        <div className="md:col-span-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.lineTotal`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Total
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    className="h-9 text-sm text-right bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-800/50 font-medium text-green-700 dark:text-green-300"
                                    type="number"
                                    readOnly
                                    value={field.value ?? 0}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => append({ ...PRODUCT_DEFAULT })}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Product
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() =>
              append({
                itemType: "service",
                service: "",
                amount: 0,
                description: "",
                gstPercentage: 18, // NEW
                lineTax: 0, // NEW
                lineTotal: 0,
              })
            }
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </div>
      </div>

      <Separator />

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-full max-w-sm space-y-3">
          {/* Subtotal */}
          <FormField
            control={form.control}
            name="totalAmount"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="font-medium">Subtotal</FormLabel>
                  <Input
                    type="number"
                    readOnly
                    className="w-40 text-right bg-muted"
                    {...field}
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* GST row only when enabled */}
          {gstEnabled && (
            <div className="flex items-center justify-between">
              <FormLabel className="font-medium">GST</FormLabel>
              <FormField
                control={form.control}
                name="taxAmount"
                render={({ field }) => (
                  <Input
                    type="number"
                    readOnly
                    className="w-40 text-right bg-muted"
                    value={field.value ?? 0}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          )}

          {/* Invoice total */}
          <FormField
            control={form.control}
            name="invoiceTotal"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="font-bold">
                    Invoice Total{gstEnabled ? " (GST incl.)" : ""}
                  </FormLabel>
                  <Input
                    type="number"
                    readOnly
                    className="w-40 text-right bg-muted text-lg font-bold"
                    value={field.value ?? 0}
                    onChange={field.onChange}
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dontSendInvoice"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="cursor-pointer">
                    Don't Send Invoice
                  </FormLabel>
                  <FormDescription className="text-xs text-muted-foreground">
                    Check this if you don't want to email the invoice to the
                    customer
                  </FormDescription>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );

  const renderReceiptPaymentFields = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.businessName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Transaction Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="party"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{partyLabel}</FormLabel>
              <Combobox
                options={partyOptions}
                value={field.value || ""}
                // onChange={field.onChange}
                onChange={(value) => {
                  field.onChange(value);
                  handlePartyChange(value); // <-- fetch and setBalance
                }}
                placeholder="Select or create..."
                searchPlaceholder="Search..."
                noResultsText="No results found."
                creatable={partyCreatable}
                onCreate={async (name) => {
                  if (!partyCreatable) {
                    toast({
                      variant: "destructive",
                      title: "Permission denied",
                      description:
                        type === "sales" || type === "receipt"
                          ? "You don't have permission to create customers."
                          : "You don't have permission to create vendors.",
                    });
                    return "";
                  }
                  handleTriggerCreateParty(name);
                  return "";
                }}
              />
              <FormMessage />
              {balance != null && type === "receipt" && (
                <div className="mt-2 text-xs text-red-600">
                  Balance: ₹{Number(balance).toFixed(2)}
                  {/* {Number(receiptAmountWatch || 0) > 0 && (
                    <> → After receipt: ₹{remainingAfterReceipt?.toFixed(2)}</>
                  )} */}
                </div>
              )}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="totalAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0.00" {...field} />
              </FormControl>
              {/* <FormControl>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const raw =
                      e.target.value === "" ? "" : e.target.valueAsNumber;

                    if (type === "receipt" && balance != null && raw !== "") {
                      // prevent over-payment
                      const max = Number(balance);
                      const safe = Math.max(0, Math.min(Number(raw) || 0, max));
                      if (safe !== raw) {
                        toast({
                          variant: "destructive",
                          title: "Amount exceeds balance",
                          description: `You can receive at most ₹${max.toFixed(
                            2
                          )} for this customer.`,
                        });
                      }
                      field.onChange(safe);
                    } else {
                      field.onChange(raw);
                    }
                  }}
                  // optional: show a visual max hint
                  {...(type === "receipt" && balance != null
                    ? { max: Number(balance) }
                    : {})}
                />
              </FormControl> */}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="referenceNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Reference Number (Optional)</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Cheque No, Ref #" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description / Narration</FormLabel>
            <FormControl>
              <Textarea placeholder="Describe the transaction..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  if (!transactionToEdit && !isSuper && allowedTypes.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">No permissions</h2>
        <p className="text-sm text-muted-foreground">
          You don’t have access to create any transactions. Please contact your
          administrator.
        </p>
      </div>
    );
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="contents">
          <ScrollArea className="flex-1 overflow-y-hidden">
            <div className="p-6 space-y-6">
              <Tabs
                value={type}
                onValueChange={(value) => form.setValue("type", value as any)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-5">
                  {canSales && (
                    <TabsTrigger value="sales" disabled={!!transactionToEdit}>
                      Sales
                    </TabsTrigger>
                  )}
                  {canPurchases && (
                    <TabsTrigger
                      value="purchases"
                      disabled={!!transactionToEdit}
                    >
                      Purchases
                    </TabsTrigger>
                  )}
                  {canReceipt && (
                    <TabsTrigger value="receipt" disabled={!!transactionToEdit}>
                      Receipt
                    </TabsTrigger>
                  )}
                  {canPayment && (
                    <TabsTrigger value="payment" disabled={!!transactionToEdit}>
                      Payment
                    </TabsTrigger>
                  )}
                  {canJournal && (
                    <TabsTrigger value="journal" disabled={!!transactionToEdit}>
                      Journal
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="sales" className="pt-6">
                  {renderSalesPurchasesFields()}
                </TabsContent>
                <TabsContent value="purchases" className="pt-6">
                  {renderSalesPurchasesFields()}
                </TabsContent>
                <TabsContent value="receipt" className="pt-6">
                  {renderReceiptPaymentFields()}
                </TabsContent>
                <TabsContent value="payment" className="pt-6">
                  {renderReceiptPaymentFields()}
                </TabsContent>
                <TabsContent value="journal" className="pt-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-base font-medium pb-2 border-b">
                        Core Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <FormField
                          control={form.control}
                          name="company"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a company" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {companies.map((c) => (
                                    <SelectItem key={c._id} value={c._id}>
                                      {c.businessName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Transaction Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-0"
                                  align="start"
                                >
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date > new Date() ||
                                      date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-base font-medium pb-2 border-b">
                        Journal Entry
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <FormField
                          control={form.control}
                          name="fromAccount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Debit Account</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Rent Expense"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="toAccount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Credit Account</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Cash" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="totalAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-base font-medium pb-2 border-b">
                        Additional Details
                      </h3>
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Narration</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe the transaction..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
          <div className="flex justify-end p-6 border-t bg-background">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {transactionToEdit ? "Save Changes" : "Create Transaction"}
            </Button>
          </div>
        </form>
      </Form>
      <Dialog open={isPartyDialogOpen} onOpenChange={setIsPartyDialogOpen}>
        <DialogContent
          wide
          className="sm:max-w-2xl grid-rows-[auto,1fr,auto] max-h-[90vh] p-0 "
          style={{ maxWidth: "1200px" }}
        >
          <DialogHeader className="p-6">
            <DialogTitle>
              Create New{" "}
              {["sales", "receipt"].includes(type) ? "Customer" : "Vendor"}
            </DialogTitle>
            <DialogDescription>
              Fill out the form below to add a new entity to your list.
            </DialogDescription>
          </DialogHeader>
          {type === "sales" || type === "receipt" ? (
            <CustomerForm
              initialName={newEntityName}
              onSuccess={handlePartyCreated}
            />
          ) : (
            <VendorForm
              initialName={newEntityName}
              onSuccess={handlePartyCreated}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Product</DialogTitle>
            <DialogDescription>
              Fill in the form to add a new product.
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            productType={"product"}
            onSuccess={handleProductCreated}
            initialName={newEntityName} // Add this
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
