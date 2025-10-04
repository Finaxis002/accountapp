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
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  Loader2,
  PlusCircle,
  Trash2,
  Copy,
  Pencil,
} from "lucide-react";
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
import { generatePdfForTemplate1 } from "@/lib/pdf-template1";
import { generatePdfForTemplate2 } from "@/lib/pdf-template2";
import { generatePdfForTemplate3 } from "@/lib/pdf-template3";
import { generatePdfForTemplate4 } from "@/lib/pdf-template4";
import { generatePdfForTemplate5 } from "@/lib/pdf-template5";
import { generatePdfForTemplate6 } from "@/lib/pdf-template6";
import { generatePdfForTemplate7 } from "@/lib/pdf-template7";
import { getUnifiedLines } from "@/lib/getUnifiedLines";

import QuillEditor from "@/components/ui/quill-editor";
import axios from "axios";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { State, City } from "country-state-city";

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

type UnitType = (typeof unitTypes)[number] | string;
const STANDARD_GST = 18; // default "Standard"
const GST_OPTIONS = [
  { label: "0%", value: "0" },
  { label: "5%", value: "5" },
  { label: "Standard (18%)", value: "18" },
  { label: "40%", value: "40" },
] as const;

type StockItemInput = { product: string; quantity: number };

interface BankDetail {
  _id: string;
  client: string;
  company: string | Company; // Can be string ID or Company object
  bankName: string;
  managerName: string;
  contactNumber: string;
  email?: string;
  city: string;
  ifscCode?: string;
  branchAddress?: string;
}

const PRODUCT_DEFAULT = {
  itemType: "product" as const,
  product: "",
  quantity: 1,
  pricePerUnit: 0,
  unitType: "Piece",
  otherUnit: "",
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
    unitType: z.string().optional(),
    otherUnit: z.string().optional(),
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
      // NEW: Validation for otherUnit
      if (data.unitType === "Other" && !data.otherUnit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["otherUnit"],
          message: "Please specify the unit type",
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
    dueDate: z.date().optional(),
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
    bank: z.string().optional(),
    notes: z.string().optional(),
    // Shipping address fields
    sameAsBilling: z.boolean().optional(),
    shippingAddress: z.string().optional(),
    shippingAddressDetails: z
      .object({
        label: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        pincode: z.string().optional(),
        contactNumber: z.string().optional(),
      })
      .optional(),
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
  const [banks, setBanks] = React.useState<any[]>([]);

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
  const [showNotes, setShowNotes] = React.useState(false);
  const paymentMethods = ["Cash", "Credit", "UPI", "Bank Transfer", "Cheque"];
  const [existingUnits, setExistingUnits] = React.useState<any[]>([]);
  const [unitOpen, setUnitOpen] = React.useState(false);
  const [originalQuantities, setOriginalQuantities] = React.useState<
    Map<string, number>
  >(new Map());

  // Shipping address states
  const [shippingAddresses, setShippingAddresses] = React.useState<any[]>([]);
  const [isShippingAddressDialogOpen, setIsShippingAddressDialogOpen] =
    React.useState(false);
  const [selectedShippingAddress, setSelectedShippingAddress] =
    React.useState<any>(null);
  const [isEditShippingAddressDialogOpen, setIsEditShippingAddressDialogOpen] =
    React.useState(false);
  const [editingShippingAddress, setEditingShippingAddress] =
    React.useState<any>(null);
  const [editAddressForm, setEditAddressForm] = React.useState({
    label: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    contactNumber: "",
  });

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
      notes: "",
      sameAsBilling: true, // Default to same as billing
      shippingAddress: "",
      shippingAddressDetails: {
        label: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        contactNumber: "",
      },
    },
  });

  // Shipping address state and city dropdowns
  const indiaStates = React.useMemo(() => State.getStatesOfCountry("IN"), []);
  const [shippingStateCode, setShippingStateCode] = React.useState<
    string | null
  >(null);

  React.useEffect(() => {
    const currentStateName = form
      .getValues("shippingAddressDetails.state")
      ?.trim();
    if (!currentStateName) {
      setShippingStateCode(null);
      return;
    }
    const found = indiaStates.find(
      (s) => s.name.toLowerCase() === currentStateName.toLowerCase()
    );
    setShippingStateCode(found?.isoCode || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update shippingStateCode when edit dialog opens
  React.useEffect(() => {
    if (isEditShippingAddressDialogOpen && editAddressForm.state) {
      const found = indiaStates.find(
        (s) => s.name.toLowerCase() === editAddressForm.state.toLowerCase()
      );
      setShippingStateCode(found?.isoCode || null);
    }
  }, [isEditShippingAddressDialogOpen, editAddressForm.state, indiaStates]);

  const shippingStateOptions = React.useMemo(
    () =>
      indiaStates
        .map((s) => ({ value: s.isoCode, label: s.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [indiaStates]
  );

  const shippingCityOptions = React.useMemo(() => {
    if (!shippingStateCode) return [];
    const list = City.getCitiesOfState("IN", shippingStateCode);
    return list
      .map((c) => ({ value: c.name, label: c.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [shippingStateCode]);

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
  const isSuper = role === "master" || role === "customer";

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

  const { fields, append, remove, replace, insert } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = useWatch({ control: form.control, name: "items" });
  const receiptAmountWatch = useWatch({
    control: form.control,
    name: "totalAmount",
  });
  const type = form.watch("type");

  // right after your existing watches
  const afterReceiptBalance = React.useMemo(() => {
    if (type !== "receipt" || balance == null) return null;
    const amt = Number(receiptAmountWatch || 0);
    return Math.max(0, Number(balance) - (Number.isFinite(amt) ? amt : 0));
  }, [type, balance, receiptAmountWatch]);

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

  // Wrap fetchBanks in useCallback to prevent infinite re-renders
  const fetchBanks = React.useCallback(
    async (companyId: string) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");

        const res = await fetch(
          `${baseURL}/api/bank-details?companyId=${companyId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.ok) {
          const data = await res.json();
          // Check the actual structure of the response
          let banksData = data;

          // Handle different response structures
          if (data && data.banks) {
            banksData = data.banks; // If response has { banks: [...] }
          } else if (Array.isArray(data)) {
            banksData = data; // If response is directly an array
          } else {
            banksData = []; // Fallback to empty array
          }

          // console.log("Processed Banks Data:", banksData);

          // Filter banks by company ID - check different possible structures
          const filteredBanks = banksData.filter((bank: any) => {
            // Handle different possible structures for company reference
            const bankCompanyId =
              bank.company?._id || // Object with _id
              bank.company || // Direct string ID
              bank.companyId; // Alternative field name

            // console.log(
            //   `Bank: ${bank.bankName}, Company ID: ${bankCompanyId}, Target: ${companyId}`
            // );

            return bankCompanyId === companyId;
          });

          // console.log("Filtered Banks:", filteredBanks);
          setBanks(filteredBanks);
        } else {
          throw new Error("Failed to fetch banks.");
        }
      } catch (error) {
        console.error("Error fetching banks:", error);
        setBanks([]);
        toast({
          variant: "destructive",
          title: "Error fetching banks",
          description:
            error instanceof Error ? error.message : "Something went wrong.",
        });
      }
    },
    [baseURL, toast]
  ); // Add dependencies

  // Use useEffect to fetch banks when the selected company in the FORM changes
  React.useEffect(() => {
    if (selectedCompanyIdWatch) {
     
      fetchBanks(selectedCompanyIdWatch);
    } else {
      setBanks([]); // Clear banks if no company is selected in the form
    }
  }, [selectedCompanyIdWatch, fetchBanks]); // Use selectedCompanyIdWatch instead of selectedCompanyId


  // Fetch shipping addresses when party changes
  const fetchShippingAddresses = React.useCallback(
    async (partyId: string) => {
      if (!partyId) {
        setShippingAddresses([]);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");

        const res = await fetch(
          `${baseURL}/api/shipping-addresses/party/${partyId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setShippingAddresses(data.shippingAddresses || []);
        } else {
          setShippingAddresses([]);
        }
      } catch (error) {
        console.error("Error fetching shipping addresses:", error);
        setShippingAddresses([]);
      }
    },
    [baseURL]
  );

  // Add another useEffect to log banks after they update
  // React.useEffect(() => {
  //   console.log("Banks state updated:", banks);
  // }, [banks]);

  // console.log("selectedCompanyId :", selectedCompanyId);


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
    const fetchUnits = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${baseURL}/api/units`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("units fetched :", res);
        if (res.ok) {
          const units = await res.json();
          setExistingUnits(units);
        }
      } catch (error) {
        console.error("Failed to fetch units:", error);
      }
    };
    fetchUnits();
  }, [baseURL]);

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
      otherUnit: p.otherUnit ?? " ",
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
      otherUnit: i.otherUnit ?? " ",
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
          otherUnit: " ",
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
    // reset the form with normalized items
    form.reset({
      type: transactionToEdit.type,
      company:
        transactionToEdit?.company &&
        typeof transactionToEdit.company === "object"
          ? transactionToEdit.company._id || ""
          : typeof transactionToEdit?.company === "string"
          ? transactionToEdit.company === "all"
            ? ""
            : transactionToEdit.company
          : "",
      date: new Date(transactionToEdit.date),
      dueDate: transactionToEdit.dueDate
        ? new Date(transactionToEdit.dueDate)
        : undefined,
      totalAmount:
        transactionToEdit.totalAmount || (transactionToEdit as any).amount,
      items: itemsToSet,
      description: transactionToEdit.description || "",
      narration: (transactionToEdit as any).narration || "",
      party: partyId,
      referenceNumber: (transactionToEdit as any).referenceNumber,
      fromAccount: (transactionToEdit as any).debitAccount,
      toAccount: (transactionToEdit as any).creditAccount,
      paymentMethod: (transactionToEdit as any).paymentMethod || "",
      bank:
        typeof (transactionToEdit as any).bank === "object"
          ? (transactionToEdit as any).bank._id
          : (transactionToEdit as any).bank || "",
      notes: (transactionToEdit as any).notes || "",
      sameAsBilling: !(transactionToEdit as any).shippingAddress,
      shippingAddress:
        (transactionToEdit as any).shippingAddress?._id ||
        (transactionToEdit as any).shippingAddress ||
        "",
      shippingAddressDetails: (transactionToEdit as any).shippingAddress
        ? {
            label: (transactionToEdit as any).shippingAddress.label || "",
            address: (transactionToEdit as any).shippingAddress.address || "",
            city: (transactionToEdit as any).shippingAddress.city || "",
            state: (transactionToEdit as any).shippingAddress.state || "",
            pincode: (transactionToEdit as any).shippingAddress.pincode || "",
            contactNumber:
              (transactionToEdit as any).shippingAddress.contactNumber || "",
          }
        : {
            label: "",
            address: "",
            city: "",
            state: "",
            pincode: "",
            contactNumber: "",
          },
    });
    // Show notes section if there are existing notes
    if (
      (transactionToEdit as any).notes &&
      (transactionToEdit as any).notes.trim()
    ) {
      setShowNotes(true);
    }

    replace(itemsToSet);

    // Store original quantities for stock updates
    const origMap = new Map<string, number>();
    itemsToSet.forEach((item: any) => {
      if (item.product) {
        origMap.set(item.product, Number(item.quantity) || 0);
      }
    });
    setOriginalQuantities(origMap);
  }, [transactionToEdit, form, replace]);

  React.useEffect(() => {
    if (transactionToEdit) return; // don't change type while editing
    const current = form.getValues("type");
    if (!allowedTypes.includes(current)) {
      form.setValue("type", allowedTypes[0] ?? "sales");
    }
  }, [allowedTypes, transactionToEdit, form]);

  // Add this useEffect to handle bank selection after banks are loaded
  React.useEffect(() => {
    if (transactionToEdit && banks.length > 0) {
      const bankValue = form.getValues("bank");
      if (bankValue) {
        // Check if the bank value exists in the banks list
        const bankExists = banks.some((bank) => bank._id === bankValue);
        if (!bankExists) {
          console.log("Bank not found in available banks, clearing value");
          form.setValue("bank", "");
        } else {
          console.log("Bank found, keeping value:", bankValue);
        }
      }
    }
  }, [banks, transactionToEdit, form]);

  // Fetch shipping addresses when party changes
  React.useEffect(() => {
    const partyId = form.watch("party");
    if (partyId && type === "sales") {
      fetchShippingAddresses(partyId);
    }
  }, [form.watch("party"), type, fetchShippingAddresses]);


  // Populate shipping address details when editing and addresses are loaded
  React.useEffect(() => {
    if (transactionToEdit && shippingAddresses.length > 0) {
      const shippingAddrId = form.getValues("shippingAddress");
      if (shippingAddrId && shippingAddrId !== "new") {
        const selectedAddr = shippingAddresses.find(
          (addr) => addr._id === shippingAddrId
        );
        if (selectedAddr) {
          form.setValue("shippingAddressDetails", {
            label: selectedAddr.label,
            address: selectedAddr.address,
            city: selectedAddr.city,
            state: selectedAddr.state,
            pincode: selectedAddr.pincode || "",
            contactNumber: selectedAddr.contactNumber || "",
          });
          // Update state code for city dropdown
          const found = indiaStates.find(
            (s) =>
              s.name.toLowerCase() === (selectedAddr.state || "").toLowerCase()
          );
          setShippingStateCode(found?.isoCode || null);
        }
      }
    }
  }, [transactionToEdit, shippingAddresses, form, indiaStates]);

  // async function updateStock(token: string, items: Item[]) {
  async function updateStock(
    token: string,
    items: StockItemInput[],
    action: "increase" | "decrease" = "decrease"
  ) {
    try {
      const res = await fetch(`${baseURL}/api/products/update-stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items, action }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update stock levels.");
      }
    } catch (error) {
      console.error("Stock update failed:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update stock levels.";

      toast({
        variant: "destructive",
        title: "Stock Update Failed",
        description: `Transaction was saved, but ${errorMessage}`,
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

  const handleFormSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  const scrollToFirstError = () => {
    const errors = form.formState.errors;

    // Define the order of fields to check for errors (top to bottom)
    const fieldOrder = [
      "company",
      "date",
      "party",
      "paymentMethod",
      "bank",
      "items.0.product",
      "items.0.quantity",
      "items.0.unitType",
      "items.0.otherUnit",
      "items.0.pricePerUnit",
      "items.0.amount",
      "items.0.gstPercentage",
      "items.0.lineTax",
      "items.0.lineTotal",
      "items.0.description",
      "totalAmount",
      "taxAmount",
      "invoiceTotal",
      "referenceNumber",
      "description",
      "narration",
      "fromAccount",
      "toAccount",
      "notes",
    ];

    // Find the first field in order that has an error
    for (const fieldName of fieldOrder) {
      if (errors[fieldName as keyof typeof errors]) {
        let selector = `[name="${fieldName}"]`;

        // Handle array fields like items.0.product
        if (fieldName.includes(".")) {
          const parts = fieldName.split(".");
          if (parts[0] === "items") {
            selector = `[name="items.${parts[1]}.${parts[2]}"]`;
          }
        }

        const errorElement = document.querySelector(selector) as HTMLElement;
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
          // Focus the field after scrolling
          setTimeout(() => {
            errorElement.focus();
          }, 500);
          break; // Stop after finding the first error
        }
      }
    }
  };

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
            otherUnit: i.otherUnit,
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

      // --- Handle shipping address for sales ---
      let shippingAddressId = null;
      if (values.type === "sales") {
        if (values.sameAsBilling) {
          // Use party's default address - no shipping address record needed
          shippingAddressId = null;
        } else if (values.shippingAddress && values.shippingAddress !== "new") {
          // Use existing shipping address
          shippingAddressId = values.shippingAddress;
        } else if (
          values.shippingAddress === "new" &&
          values.shippingAddressDetails
        ) {
          // Create new shipping address
          try {
            const shippingPayload = {
              party: values.party,
              label: values.shippingAddressDetails.label || "New Address",
              address: values.shippingAddressDetails.address || "",
              city: values.shippingAddressDetails.city || "",
              state: values.shippingAddressDetails.state || "",
              pincode: values.shippingAddressDetails.pincode || "",
              contactNumber: values.shippingAddressDetails.contactNumber || "",
            };

            const shippingRes = await fetch(
              `${baseURL}/api/shipping-addresses`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(shippingPayload),
              }
            );

            if (shippingRes.ok) {
              const shippingData = await shippingRes.json();
              shippingAddressId = shippingData.shippingAddress._id;

              // Add to local state for future use
              setShippingAddresses((prev) => [
                ...prev,
                shippingData.shippingAddress,
              ]);
            } else {
              throw new Error("Failed to create shipping address");
            }
          } catch (error) {
            console.error("Error creating shipping address:", error);
            toast({
              variant: "destructive",
              title: "Shipping Address Error",
              description:
                "Failed to save shipping address. Transaction will proceed without it.",
            });
          }
        }
      }

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
          dueDate: values.dueDate,
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
          bank: values.bank || undefined,
          notes: values.notes || "",
          shippingAddress: shippingAddressId,
        };
      }

      // Special handling for payment transactions - backend expects 'amount' field
      if (values.type === "payment") {
        payload.amount = values.totalAmount;
        delete payload.totalAmount;
        delete payload.subTotal;
        delete payload.taxAmount;
        delete payload.invoiceTotal;
        delete payload.products;
        delete payload.services;
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

      // Update stock for sales (decrease) and purchases (increase)
      if (
        (values.type === "sales" || values.type === "purchases") &&
        productLines.length
      ) {
        let stockUpdates: {
          product: string;
          quantity: number;
          action: "increase" | "decrease";
        }[] = [];

        if (transactionToEdit) {
          // For updates, calculate differences
          for (const newItem of productLines) {
            const productId = newItem.product!;
            const newQty = Number(newItem.quantity) || 0;
            const oldQty = originalQuantities.get(productId) || 0;
            const diff = newQty - oldQty;

            if (diff !== 0) {
              let action: "increase" | "decrease";
              if (values.type === "sales") {
                action = diff > 0 ? "decrease" : "increase";
              } else {
                action = diff > 0 ? "increase" : "decrease";
              }
              stockUpdates.push({
                product: productId,
                quantity: Math.abs(diff),
                action,
              });
            }
          }
        } else {
          // For new transactions
          const action = values.type === "sales" ? "decrease" : "increase";
          stockUpdates = productLines.map((p) => ({
            product: p.product!,
            quantity: Number(p.quantity) || 0,
            action,
          }));
        }

        // Group by action and call updateStock
        const decreaseItems = stockUpdates
          .filter((u) => u.action === "decrease")
          .map((u) => ({ product: u.product, quantity: u.quantity }));
        const increaseItems = stockUpdates
          .filter((u) => u.action === "increase")
          .map((u) => ({ product: u.product, quantity: u.quantity }));

        if (decreaseItems.length > 0) {
          await updateStock(token, decreaseItems, "decrease");
        }
        if (increaseItems.length > 0) {
          await updateStock(token, increaseItems, "increase");
        }
      }

      // 🔽 SEND INVOICE PDF BY EMAIL (Sales only)

      const templateRes = await fetch(
        `${baseURL}/api/settings/default-template`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const templateData = await templateRes.json();

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
            const enrichedTransaction = enrichTransactionWithNames(
              saved,
              products,
              services
            );
            let pdfDoc;
            switch (templateData.defaultTemplate) {
              case "template1":
                pdfDoc = generatePdfForTemplate1(
                  enrichedTransaction,
                  companyDoc as any,
                  partyDoc as any,
                  serviceNameById
                );
                break;
              case "template2":
                pdfDoc = generatePdfForTemplate2(
                  enrichedTransaction,
                  companyDoc as any,
                  partyDoc as any,
                  serviceNameById
                );
                break;
              case "template3":
                pdfDoc = generatePdfForTemplate3(
                  enrichedTransaction,
                  companyDoc as any,
                  partyDoc as any,
                  serviceNameById
                );
                break;
              case "template4":
                pdfDoc = generatePdfForTemplate4(
                  enrichedTransaction,
                  companyDoc as any,
                  partyDoc as any,
                  serviceNameById
                );
                break;
              case "template5":
                pdfDoc = generatePdfForTemplate5(
                  enrichedTransaction,
                  companyDoc as any,
                  partyDoc as any,
                  serviceNameById
                );
                break;
              case "template6":
                pdfDoc = generatePdfForTemplate6(
                  enrichedTransaction,
                  companyDoc as any,
                  partyDoc as any,
                  serviceNameById
                );
                break;
              case "template7":
                pdfDoc = generatePdfForTemplate7(
                  enrichedTransaction,
                  companyDoc as any,
                  partyDoc as any,
                  serviceNameById
                );
                break;
              default:
                pdfDoc = generatePdfForTemplate1(
                  enrichedTransaction,
                  companyDoc as any,
                  partyDoc as any,
                  serviceNameById
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

         
          // Send WhatsApp message if party has contact number
          if (partyDoc?.contactNumber) {
            try {
              // Prepare detailed invoice message
              const invoiceDetails = {
                invoiceNumber:
                  saved.invoiceNumber || saved.referenceNumber || "N/A",
                date: values.date,
                companyName: companyDoc?.businessName || "Your Company",
                partyName: partyDoc?.name || "Customer",
                items: [] as Array<{
                  name: string;
                  quantity: number | undefined;
                  price: number | undefined;
                  amount: number;
                }>,
                subTotal: uiSubTotal,
                taxAmount: uiTax,
                totalAmount: uiInvoiceTotal,
              };

              // Add product items
              if (productLines.length > 0) {
                productLines.forEach((item) => {
                  const product = products.find((p) => p._id === item.product);
                  invoiceDetails.items.push({
                    name: product?.name || "Product",
                    quantity: item.quantity,
                    price: item.pricePerUnit,
                    amount: item.amount,
                  });
                });
              }

              // Add service items
              if (serviceLines.length > 0) {
                serviceLines.forEach((item) => {
                  const service = services.find((s) => s._id === item.service);
                  invoiceDetails.items.push({
                    name: service?.serviceName || "Service",
                    quantity: 1,
                    price: item.amount,
                    amount: item.amount,
                  });
                });
              }

              // await axios.post('http://localhost:8745/send-whatsapp', {

              await axios.post("/send-whatsapp", {
                phoneNumber: partyDoc.contactNumber,
                transactionDetails: invoiceDetails,
                messageType: "detailed_invoice",
              });

              toast({
                title: "WhatsApp message sent",
                description: `Invoice details sent to ${partyDoc.contactNumber}`,
              });
            } catch (error) {
              console.error("Error sending WhatsApp message:", error);
              toast({
                variant: "destructive",
                title: "WhatsApp message failed",
                description: "Failed to send invoice details via WhatsApp.",
              });
            }
          }
        }
      }

      // Success toast and form close for all transactions
      const inv =
        values.type === "sales" ? data?.entry?.invoiceNumber : undefined;
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

      // Fetch shipping addresses for the selected party
      await fetchShippingAddresses(partyId);

      // Reset shipping address selection
      form.setValue("shippingAddress", "");
      form.setValue("sameAsBilling", true);
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

  const handleDeleteUnit = async (unitId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const res = await fetch(`${baseURL}/api/units/${unitId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete unit");
      }

      // Refresh units
      const unitsRes = await fetch(`${baseURL}/api/units`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (unitsRes.ok) {
        const units = await unitsRes.json();
        setExistingUnits(units);
      }

      toast({
        title: "Unit deleted",
        description: "The unit has been removed successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  };

  const paymentMethod = useWatch({
    control: form.control,
    name: "paymentMethod",
  });

  const getPartyOptions = () => {
    if (type === "sales" || type === "receipt") {
      // All parties (customers) – no filter for balance
      const source = parties;

      // Group by name to check for duplicates
      const nameCount = source.reduce((acc, p) => {
        const name = p.name || "";
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // For RECEIPT, show all customers regardless of balance
      return source.map((p) => {
        const name = p.name || "";
        const hasDuplicates = nameCount[name] > 1;
        const label = hasDuplicates
          ? `${name} (${p.contactNumber || ""})`
          : name;
        return {
          value: p._id,
          label: String(label),
        };
      });
    }

    if (type === "purchases" || type === "payment") {
      // vendors
      // Group by vendorName to check for duplicates
      const nameCount = vendors.reduce((acc, v) => {
        const name = v.vendorName || "";
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return vendors.map((v) => {
        const name = v.vendorName || "";
        const hasDuplicates = nameCount[name] > 1;
        const label = hasDuplicates
          ? `${name} (${v.contactNumber || ""})`
          : name;
        return {
          value: v._id,
          label: String(label),
        };
      });
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

  // Must have at least one transaction-create permission.
  const hasAnyTxnCreate =
    canSales || canPurchases || canReceipt || canPayment || canJournal;

  const hasAnyEntityCreate =
    canCreateCustomer || canCreateVendor || canCreateInventory;

  const canOpenForm = isSuper || !!transactionToEdit || hasAnyTxnCreate;

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              {/* {form.watch("shippingAddress") && form.watch("shippingAddress") !== "new" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    const selectedAddr = shippingAddresses.find(addr => addr._id === form.watch("shippingAddress"));
                    if (selectedAddr) {
                      setEditingShippingAddress(selectedAddr);
                      setEditAddressForm({
                        label: selectedAddr.label || "",
                        address: selectedAddr.address || "",
                        city: selectedAddr.city || "",
                        state: selectedAddr.state || "",
                        pincode: selectedAddr.pincode || "",
                        contactNumber: selectedAddr.contactNumber || "",
                      });
                      setIsEditShippingAddressDialogOpen(true);
                    }
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Address
                </Button>
              )} */}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="mb-2">Transaction Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full px-3 py-2 h-10 text-left font-normal",
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

        {/* Add Due Date Field Here */}
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="mb-2">Due Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full px-3 py-2 h-10 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Select due date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="flex">
                    {/* Quick Date Options Sidebar */}
                    <div className="flex flex-col p-3 border-r bg-muted/50 max-w-min">
                      <div className="space-y-1 max-w-sm">
                        {[
                          { label: "7 Days", days: 7 },
                          { label: "10 Days", days: 10 },
                          { label: "15 Days", days: 15 },
                          { label: "30 Days", days: 30 },
                          { label: "45 Days", days: 45 },
                          { label: "60 Days", days: 60 },
                          { label: "90 Days", days: 90 },
                        ].map((option) => (
                          <Button
                            key={option.days}
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs h-7 px-2"
                            onClick={() => {
                              const currentDate =
                                form.getValues("date") || new Date();
                              const dueDate = new Date(currentDate);
                              dueDate.setDate(dueDate.getDate() + option.days);
                              form.setValue("dueDate", dueDate);
                            }}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>

                      {/* Custom Date Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs h-7 px-2 mt-2 border-t pt-2"
                        onClick={() => {
                          // This will keep the calendar open for custom selection
                        }}
                      >
                        Custom Date
                      </Button>
                    </div>

                    {/* Calendar Section */}
                    <div className="p-3">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                        className="p-0"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  // Only fetch balance for sales and receipt, not for purchases/payment
                  if (type === "sales" || type === "receipt") {
                    handlePartyChange(value);
                  } else {
                    setBalance(null);
                  }
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
              {balance != null && balance > 0 && (
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
              <FormLabel>Payment Method</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
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
      </div>

      {paymentMethod !== "Cash" && (
        <FormField
          control={form.control}
          name="bank"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bank</FormLabel>
              {banks && banks.length > 0 ? (
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a bank" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {banks.map((bank) => (
                      <SelectItem key={bank._id} value={bank._id}>
                        {bank.bankName}{" "}
                        {bank.company?.businessName
                          ? `(${bank.company.businessName})`
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                  {selectedCompanyIdWatch
                    ? "No banks available for the selected company"
                    : "Select a company first"}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Shipping Address Section - Only for Sales */}
      {type === "sales" && (
        <>
          <Separator />

          <div className="space-y-4 min-h-[20vh]">
            <h3 className="text-base font-medium">Shipping Address</h3>

            <FormField
              control={form.control}
              name="sameAsBilling"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value || false}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked) {
                          // Populate with party's billing address
                          const selectedParty = parties.find(
                            (p) => p._id === form.getValues("party")
                          );
                          if (selectedParty) {
                            form.setValue("shippingAddressDetails", {
                              label: "Billing Address",
                              address: selectedParty.address || "",
                              city: selectedParty.city || "",
                              state: selectedParty.state || "",
                              pincode: "",
                              contactNumber: selectedParty.contactNumber || "",
                            });
                            form.setValue("shippingAddress", "");
                          }
                        } else {
                          // Clear shipping address details
                          form.setValue("shippingAddressDetails", {
                            label: "",
                            address: "",
                            city: "",
                            state: "",
                            pincode: "",
                            contactNumber: "",
                          });
                          form.setValue("shippingAddress", "");
                        }
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">
                      Same as billing address
                    </FormLabel>
                    <FormDescription className="text-xs text-muted-foreground">
                      Use the customer's billing address as the shipping address
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!form.watch("sameAsBilling") && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="shippingAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping Address</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value && value !== "new") {
                            const selectedAddr = shippingAddresses.find(
                              (addr) => addr._id === value
                            );
                            if (selectedAddr) {
                              form.setValue("shippingAddressDetails", {
                                label: selectedAddr.label,
                                address: selectedAddr.address,
                                city: selectedAddr.city,
                                state: selectedAddr.state,
                                pincode: selectedAddr.pincode || "",
                                contactNumber: selectedAddr.contactNumber || "",
                              });
                              // Update state code for city dropdown
                              const found = indiaStates.find(
                                (s) =>
                                  s.name.toLowerCase() ===
                                  (selectedAddr.state || "").toLowerCase()
                              );
                              setShippingStateCode(found?.isoCode || null);
                            }
                          } else if (value === "new") {
                            // Clear details for new address
                            form.setValue("shippingAddressDetails", {
                              label: "",
                              address: "",
                              city: "",
                              state: "",
                              pincode: "",
                              contactNumber: "",
                            });
                            setShippingStateCode(null);
                          }
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select saved address or create new" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {shippingAddresses.map((addr) => (
                            <SelectItem key={addr._id} value={addr._id}>
                              <div className="flex items-center justify-between w-full">
                                <span>
                                  {addr.label} - {addr.address}, {addr.city}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-muted"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingShippingAddress(addr);
                                    setEditAddressForm({
                                      label: addr.label || "",
                                      address: addr.address || "",
                                      city: addr.city || "",
                                      state: addr.state || "",
                                      pincode: addr.pincode || "",
                                      contactNumber: addr.contactNumber || "",
                                    });
                                    setIsEditShippingAddressDialogOpen(true);
                                  }}
                                ></Button>
                              </div>
                            </SelectItem>
                          ))}
                          <SelectItem value="new">
                            + Create New Address
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("shippingAddress") === "new" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                    <FormField
                      control={form.control}
                      name="shippingAddressDetails.label"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Label</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Home, Office, Warehouse"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shippingAddressDetails.contactNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Contact number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shippingAddressDetails.address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Full address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shippingAddressDetails.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <Combobox
                            options={shippingStateOptions}
                            value={
                              shippingStateCode ??
                              shippingStateOptions.find(
                                (o) =>
                                  o.label.toLowerCase() ===
                                  (field.value || "").toLowerCase()
                              )?.value ??
                              ""
                            }
                            onChange={(iso) => {
                              setShippingStateCode(iso);
                              const selected = indiaStates.find(
                                (s) => s.isoCode === iso
                              );
                              field.onChange(selected?.name || "");
                              form.setValue("shippingAddressDetails.city", "", {
                                shouldValidate: true,
                              });
                            }}
                            placeholder="Select state"
                            searchPlaceholder="Type a state…"
                            noResultsText="No states found."
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shippingAddressDetails.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <Combobox
                            options={shippingCityOptions}
                            value={
                              shippingCityOptions.find(
                                (o) =>
                                  o.label.toLowerCase() ===
                                  (field.value || "").toLowerCase()
                              )?.value ?? ""
                            }
                            onChange={(v) => field.onChange(v)}
                            placeholder={
                              shippingStateCode
                                ? "Select city"
                                : "Select a state first"
                            }
                            searchPlaceholder="Type a city…"
                            noResultsText={
                              shippingStateCode
                                ? "No cities found."
                                : "Select a state first"
                            }
                            disabled={
                              !shippingStateCode ||
                              shippingCityOptions.length === 0
                            }
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shippingAddressDetails.pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pincode</FormLabel>
                          <FormControl>
                            <Input placeholder="Pincode" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            )}

            {form.watch("shippingAddress") &&
              form.watch("shippingAddress") !== "new" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    const selectedAddr = shippingAddresses.find(
                      (addr) => addr._id === form.watch("shippingAddress")
                    );
                    if (selectedAddr) {
                      setEditingShippingAddress(selectedAddr);
                      setEditAddressForm({
                        label: selectedAddr.label || "",
                        address: selectedAddr.address || "",
                        city: selectedAddr.city || "",
                        state: selectedAddr.state || "",
                        pincode: selectedAddr.pincode || "",
                        contactNumber: selectedAddr.contactNumber || "",
                      });
                      setIsEditShippingAddressDialogOpen(true);
                    }
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Address
                </Button>
              )}
          </div>
        </>
      )}

      <Separator />

      {/* Items Array */}
      <div className="space-y-4">
        <h3 className="text-base font-medium">Items & Services</h3>
        {fields.map((item, index) => (
          <Card key={item.id} className="relative">
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-4 items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-10 h-6 w-6"
                  onClick={() => {
                    const currentItem = form.getValues(`items.${index}`);
                    insert(index + 1, { ...currentItem });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
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
              </div>

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
                            onChange={(value) => {
                              field.onChange(value);
                              // Auto-populate unit when product is selected
                              if (value) {
                                const selectedProduct = products.find(
                                  (p) => p._id === value
                                );
                                if (selectedProduct?.unit) {
                                  form.setValue(
                                    `items.${index}.unitType`,
                                    selectedProduct.unit
                                  );
                                }
                              }
                            }}
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

                  {/* Product Details - Responsive Layout */}
                  <div className="grid grid-cols-2 md:flex md:flex-wrap items-end md:gap-3 gap-2 md:p-4 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
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
                            <Popover open={unitOpen} onOpenChange={setUnitOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={unitOpen}
                                    className="w-full h-9 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 justify-between"
                                  >
                                    {(() => {
                                      const otherUnit = form.watch(
                                        `items.${index}.otherUnit`
                                      );
                                      if (
                                        field.value === "Other" &&
                                        otherUnit
                                      ) {
                                        return otherUnit;
                                      }
                                      return field.value
                                        ? field.value === "Other"
                                          ? "Other (Custom)"
                                          : field.value
                                        : "Select unit...";
                                    })()}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput placeholder="Search units..." />
                                  <CommandList>
                                    <CommandEmpty>No unit found.</CommandEmpty>
                                    <CommandGroup>
                                      {unitTypes
                                        .filter((u) => u !== "Other")
                                        .map((unit) => (
                                          <CommandItem
                                            key={unit}
                                            value={unit}
                                            onSelect={() => {
                                              form.setValue(
                                                `items.${index}.unitType`,
                                                unit
                                              );
                                              setUnitOpen(false);
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                field.value === unit
                                                  ? "opacity-100"
                                                  : "opacity-0"
                                              )}
                                            />
                                            {unit}
                                          </CommandItem>
                                        ))}
                                      {existingUnits.map((unit) => (
                                        <CommandItem
                                          key={unit._id}
                                          value={unit.name}
                                          onSelect={() => {
                                            form.setValue(
                                              `items.${index}.unitType`,
                                              unit.name
                                            );
                                            setUnitOpen(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              field.value === unit.name
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          <span className="flex-1">
                                            {unit.name}
                                          </span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteUnit(unit._id);
                                            }}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </CommandItem>
                                      ))}
                                      <CommandItem
                                        value="Other"
                                        onSelect={() => {
                                          form.setValue(
                                            `items.${index}.unitType`,
                                            "Other"
                                          );
                                          setUnitOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value === "Other"
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        Other
                                      </CommandItem>
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Other Unit Input - Only show when "Other" is selected */}
                    {form.watch(`items.${index}.unitType`) === "Other" && (
                      <div className="max-w-[80px] flex-1">
                        <FormField
                          control={form.control}
                          name={`items.${index}.otherUnit`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Specify Unit
                              </FormLabel>
                              <FormControl>
                                <Input
                                  className="h-9 text-sm px-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="e.g., Bundle, Set, etc."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Price/Unit */}
                    <div className="min-w-[90px] flex-1">
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

                    {gstEnabled && (
                      <>
                        {/* HSN Code */}
                        <div className="min-w-[100px] flex-1">
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              HSN Code
                            </FormLabel>
                            <div className="h-9 flex items-center px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md">
                              <span className="text-gray-700 dark:text-gray-300 font-medium">
                                {(() => {
                                  const selectedProduct = products.find(
                                    (p) =>
                                      p._id ===
                                      form.watch(`items.${index}.product`)
                                  );
                                  return selectedProduct?.hsn || "-";
                                })()}
                              </span>
                            </div>
                          </FormItem>
                        </div>

                        {/* GST % */}
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
                    <div className="md:col-span-2">
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
                    <div className="md:col-span-3">
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
                        {/* SAC Code */}
                        <div className="md:col-span-2">
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              SAC Code
                            </FormLabel>
                            <div className="h-9 flex items-center px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md">
                              <span className="text-gray-700 dark:text-gray-300 font-medium">
                                {(() => {
                                  const selectedService = services.find(
                                    (s) =>
                                      s._id ===
                                      form.watch(`items.${index}.service`)
                                  );
                                  return selectedService?.sac || "-";
                                })()}
                              </span>
                            </div>
                          </FormItem>
                        </div>

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

      {/* Totals and Notes (Notes only for Sales) */}
      {type === "sales" ? (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Notes Section - Only for Sales */}
          <div className="flex-1">
            {!showNotes ? (
              <div className="flex justify-start py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNotes(true)}
                  className="flex items-center gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Notes
                </Button>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Notes</FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNotes(false)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        Remove Notes
                      </Button>
                    </div>
                    <FormControl>
                      <QuillEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Add detailed notes with formatting..."
                        className="min-h-[120px]"
                      />
                    </FormControl>
                    <FormDescription>
                      Add rich text notes with formatting, colors, and styles
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Totals */}
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
      ) : (
        /* For non-sales transactions, totals on the right */
        <div className="flex justify-end">
          <div className="w-full max-w-md space-y-3">
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

            {/* <FormField
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
            /> */}
          </div>
        </div>
      )}
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
              <FormLabel className="mb-2">Transaction Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full px-3 py-2 h-10 text-left font-normal",
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
                // onChange={(value) => {
                //   field.onChange(value);
                //   handlePartyChange(value); // <-- fetch and setBalance
                // }}
                onChange={(value) => {
                  field.onChange(value);

                  // Only fetch balance for receipt transactions, not for payments
                  if (type === "receipt") {
                    handlePartyChange(value);
                  } else {
                    // For payment transactions, reset balance and don't show error
                    setBalance(null);
                  }
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
                  {/* Balance: ₹{Number(balance).toFixed(2)} */}
                  {balance !== null && type === "receipt" ? (
                    <div className="text-red-500 text-sm mt-2">
                      Balance: ₹{(afterReceiptBalance ?? balance).toFixed(2)}
                    </div>
                  ) : balance !== null ? (
                    <div className="text-red-500 text-sm mt-2">
                      Balance: ₹{balance.toFixed(2)}
                    </div>
                  ) : null}
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
      <div className=" max-h-[80vh] overflow-y-auto">
        <Form {...form}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const isValid = await form.trigger();
              if (!isValid) {
                scrollToFirstError();
                return;
              }
              await form.handleSubmit(onSubmit)(e);
            }}
            className="contents"
            onSelect={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              // Prevent form selection on Tab key
              if (e.key === "Tab") {
                e.preventDefault();
                // Find next focusable element
                const focusableElements = document.querySelectorAll(
                  'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
                );
                const currentIndex = Array.from(focusableElements).indexOf(
                  document.activeElement as Element
                );
                const nextIndex = e.shiftKey
                  ? currentIndex - 1
                  : currentIndex + 1;
                if (nextIndex >= 0 && nextIndex < focusableElements.length) {
                  const nextElement = focusableElements[
                    nextIndex
                  ] as HTMLElement;
                  nextElement.focus();
                  // Scroll the element into view within the ScrollArea
                  nextElement.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                    inline: "nearest",
                  });
                }
              }
            }}
          >
            <ScrollArea className="flex-1 overflow-auto" tabIndex={-1}>
              <div className="p-6 space-y-6 select-none">
                <div className="w-full">
                  {/* Mobile Dropdown (hidden on desktop) */}
                  <div className="md:hidden mb-4">
                    <Select
                      value={type}
                      onValueChange={(value) =>
                        form.setValue("type", value as any)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select transaction type" />
                      </SelectTrigger>
                      <SelectContent>
                        {canSales && (
                          <SelectItem
                            value="sales"
                            disabled={!!transactionToEdit}
                          >
                            Sales
                          </SelectItem>
                        )}
                        {canPurchases && (
                          <SelectItem
                            value="purchases"
                            disabled={!!transactionToEdit}
                          >
                            Purchases
                          </SelectItem>
                        )}

                        {canReceipt && (
                          <SelectItem
                            value="receipt"
                            disabled={!!transactionToEdit}
                          >
                            Receipt
                          </SelectItem>
                        )}
                        {canPayment && (
                          <SelectItem
                            value="payment"
                            disabled={!!transactionToEdit}
                          >
                            Payment
                          </SelectItem>
                        )}
                        {canJournal && (
                          <SelectItem
                            value="journal"
                            disabled={!!transactionToEdit}
                          >
                            Journal
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Desktop Tabs (hidden on mobile) */}
                  <div className="hidden md:block">
                    <Tabs
                      value={type}
                      onValueChange={(value) =>
                        form.setValue("type", value as any)
                      }
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-5">
                        {canSales && (
                          <TabsTrigger
                            value="sales"
                            disabled={!!transactionToEdit}
                          >
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
                          <TabsTrigger
                            value="receipt"
                            disabled={!!transactionToEdit}
                          >
                            Receipt
                          </TabsTrigger>
                        )}
                        {canPayment && (
                          <TabsTrigger
                            value="payment"
                            disabled={!!transactionToEdit}
                          >
                            Payment
                          </TabsTrigger>
                        )}
                        {canJournal && (
                          <TabsTrigger
                            value="journal"
                            disabled={!!transactionToEdit}
                          >
                            Journal
                          </TabsTrigger>
                        )}
                      </TabsList>
                    </Tabs>
                  </div>

                  {/* Tab Content (same for both mobile and desktop) */}
                  <div className="pt-4 md:pt-6">
                    {type === "sales" && renderSalesPurchasesFields()}
                    {type === "purchases" && renderSalesPurchasesFields()}
                    {type === "receipt" && renderReceiptPaymentFields()}
                    {type === "payment" && renderReceiptPaymentFields()}
                    {type === "journal" && (
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
                                  <FormLabel className="mb-2">
                                    Transaction Date
                                  </FormLabel>

                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant={"outline"}
                                          className={cn(
                                            "w-full px-3 py-2 h-10 text-left font-normal",

                                            !field.value &&
                                              "text-muted-foreground"
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
                                    <Input
                                      placeholder="e.g., Cash"
                                      {...field}
                                    />
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
                    )}
                  </div>

                  {/* Journal Totals (only for journal type) */}
                  {type === "journal" && (
                    <div className="flex justify-end mt-6">
                      <div className="w-full max-w-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <FormLabel className="font-medium">Amount</FormLabel>
                          <FormField
                            control={form.control}
                            name="totalAmount"
                            render={({ field }) => (
                              <Input
                                type="number"
                                readOnly
                                className="w-40 text-right bg-muted"
                                {...field}
                              />
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
      </div>
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
      <Dialog
        open={isEditShippingAddressDialogOpen}
        onOpenChange={setIsEditShippingAddressDialogOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Shipping Address</DialogTitle>
            <DialogDescription>
              Update the shipping address details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Address Label</label>
                <Input
                  placeholder="e.g., Home, Office, Warehouse"
                  value={editAddressForm.label}
                  onChange={(e) =>
                    setEditAddressForm((prev) => ({
                      ...prev,
                      label: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Number</label>
                <Input
                  placeholder="Contact number"
                  value={editAddressForm.contactNumber}
                  onChange={(e) =>
                    setEditAddressForm((prev) => ({
                      ...prev,
                      contactNumber: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Textarea
                placeholder="Full address"
                value={editAddressForm.address}
                onChange={(e) =>
                  setEditAddressForm((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">State</label>
                <Combobox
                  options={shippingStateOptions}
                  value={
                    shippingStateOptions.find(
                      (o) =>
                        o.label.toLowerCase() ===
                        editAddressForm.state.toLowerCase()
                    )?.value ?? ""
                  }
                  onChange={(iso) => {
                    const selected = indiaStates.find((s) => s.isoCode === iso);
                    setEditAddressForm((prev) => ({
                      ...prev,
                      state: selected?.name || "",
                      city: "", // Reset city when state changes
                    }));
                  }}
                  placeholder="Select state"
                  searchPlaceholder="Type a state…"
                  noResultsText="No states found."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">City</label>
                <Combobox
                  options={shippingCityOptions}
                  value={
                    shippingCityOptions.find(
                      (o) =>
                        o.label.toLowerCase() ===
                        editAddressForm.city.toLowerCase()
                    )?.value ?? ""
                  }
                  onChange={(v) =>
                    setEditAddressForm((prev) => ({ ...prev, city: v }))
                  }
                  placeholder={
                    editAddressForm.state
                      ? "Select city"
                      : "Select a state first"
                  }
                  searchPlaceholder="Type a city…"
                  noResultsText={
                    editAddressForm.state
                      ? "No cities found."
                      : "Select a state first"
                  }
                  disabled={
                    !editAddressForm.state || shippingCityOptions.length === 0
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pincode</label>
              <Input
                placeholder="Pincode"
                value={editAddressForm.pincode}
                onChange={(e) =>
                  setEditAddressForm((prev) => ({
                    ...prev,
                    pincode: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditShippingAddressDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                try {
                  const token = localStorage.getItem("token");
                  if (!token)
                    throw new Error("Authentication token not found.");

                  const updatedAddress = {
                    ...editingShippingAddress,
                    ...editAddressForm,
                  };

                  const res = await fetch(
                    `${baseURL}/api/shipping-addresses/${editingShippingAddress._id}`,
                    {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify(updatedAddress),
                    }
                  );

                  if (res.ok) {
                    const data = await res.json();
                    // Update the address in the local state
                    setShippingAddresses((prev) =>
                      prev.map((addr) =>
                        addr._id === editingShippingAddress._id
                          ? data.shippingAddress
                          : addr
                      )
                    );
                    toast({
                      title: "Address Updated",
                      description:
                        "Shipping address has been updated successfully.",
                    });
                    setIsEditShippingAddressDialogOpen(false);
                  } else {
                    throw new Error("Failed to update shipping address");
                  }
                } catch (error) {
                  console.error("Error updating shipping address:", error);
                  toast({
                    variant: "destructive",
                    title: "Update Failed",
                    description: "Failed to update shipping address.",
                  });
                }
              }}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditShippingAddressDialogOpen}
        onOpenChange={setIsEditShippingAddressDialogOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Shipping Address</DialogTitle>
            <DialogDescription>
              Update the shipping address details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Address Label</label>
                <Input
                  placeholder="e.g., Home, Office, Warehouse"
                  value={editAddressForm.label}
                  onChange={(e) =>
                    setEditAddressForm((prev) => ({
                      ...prev,
                      label: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Number</label>
                <Input
                  placeholder="Contact number"
                  value={editAddressForm.contactNumber}
                  onChange={(e) =>
                    setEditAddressForm((prev) => ({
                      ...prev,
                      contactNumber: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Textarea
                placeholder="Full address"
                value={editAddressForm.address}
                onChange={(e) =>
                  setEditAddressForm((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">State</label>
                <Combobox
                  options={shippingStateOptions}
                  value={
                    shippingStateOptions.find(
                      (o) =>
                        o.label.toLowerCase() ===
                        editAddressForm.state.toLowerCase()
                    )?.value ?? ""
                  }
                  onChange={(iso) => {
                    const selected = indiaStates.find((s) => s.isoCode === iso);
                    setEditAddressForm((prev) => ({
                      ...prev,
                      state: selected?.name || "",
                      city: "", // Reset city when state changes
                    }));
                  }}
                  placeholder="Select state"
                  searchPlaceholder="Type a state…"
                  noResultsText="No states found."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">City</label>
                <Combobox
                  options={shippingCityOptions}
                  value={
                    shippingCityOptions.find(
                      (o) =>
                        o.label.toLowerCase() ===
                        editAddressForm.city.toLowerCase()
                    )?.value ?? ""
                  }
                  onChange={(v) =>
                    setEditAddressForm((prev) => ({ ...prev, city: v }))
                  }
                  placeholder={
                    editAddressForm.state
                      ? "Select city"
                      : "Select a state first"
                  }
                  searchPlaceholder="Type a city…"
                  noResultsText={
                    editAddressForm.state
                      ? "No cities found."
                      : "Select a state first"
                  }
                  disabled={
                    !editAddressForm.state || shippingCityOptions.length === 0
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pincode</label>
              <Input
                placeholder="Pincode"
                value={editAddressForm.pincode}
                onChange={(e) =>
                  setEditAddressForm((prev) => ({
                    ...prev,
                    pincode: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditShippingAddressDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                try {
                  const token = localStorage.getItem("token");
                  if (!token)
                    throw new Error("Authentication token not found.");

                  const updatedAddress = {
                    ...editingShippingAddress,
                    ...editAddressForm,
                  };

                  const res = await fetch(
                    `${baseURL}/api/shipping-addresses/${editingShippingAddress._id}`,
                    {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify(updatedAddress),
                    }
                  );

                  if (res.ok) {
                    const data = await res.json();
                    // Update the address in the local state
                    setShippingAddresses((prev) =>
                      prev.map((addr) =>
                        addr._id === editingShippingAddress._id
                          ? data.shippingAddress
                          : addr
                      )
                    );
                    toast({
                      title: "Address Updated",
                      description:
                        "Shipping address has been updated successfully.",
                    });
                    setIsEditShippingAddressDialogOpen(false);
                  } else {
                    throw new Error("Failed to update shipping address");
                  }
                } catch (error) {
                  console.error("Error updating shipping address:", error);
                  toast({
                    variant: "destructive",
                    title: "Update Failed",
                    description: "Failed to update shipping address.",
                  });
                }
              }}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
