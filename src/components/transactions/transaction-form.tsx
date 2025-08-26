"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { ServiceForm } from "../services/service-form";
import { Card, CardContent } from "../ui/card";
import { Separator } from "../ui/separator";

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

type StockItemInput = { product: string; quantity: number };

const PRODUCT_DEFAULT = {
  itemType: "product" as const,
  product: "",
  quantity: 1,
  pricePerUnit: 0,
  unitType: "Piece" as const,
  amount: 0,
};

// REPLACE the whole itemSchema with this:
const itemSchema = z
  .object({
    itemType: z.enum(["product", "service"]),
    product: z.string().optional(),
    service: z.string().optional(),
    quantity: z.coerce.number().optional(),
    unitType: z.enum(unitTypes).optional(),
    pricePerUnit: z.coerce.number().optional(),
    description: z.string().optional(),
    amount: z.coerce.number(), // product: auto; service: user-entered
  })
  .superRefine((data, ctx) => {
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
    } else if (data.itemType === "service") {
      if (!data.service) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["service"],
          message: "Select a service",
        });
      }
      if (!data.amount || data.amount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["amount"],
          message: "Enter a positive amount",
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
}

export function TransactionForm({
  transactionToEdit,
  onFormSubmit,
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

  const [isLoading, setIsLoading] = React.useState(true);

  const { selectedCompanyId } = useCompany();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange", // <— add this
    reValidateMode: "onChange", // <— and this
    defaultValues: {
      party: "",
      description: "",
      totalAmount: 0,
      items: [PRODUCT_DEFAULT],
      type: "sales",
      referenceNumber: "",
      fromAccount: "",
      toAccount: "",
      narration: "",
      company: selectedCompanyId || "",
      date: new Date(),
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = useWatch({ control: form.control, name: "items" });
  const type = form.watch("type");

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

  // REPLACE the whole calc effect with this:
  React.useEffect(() => {
    // Only auto-calc in sales/purchases
    if (!watchedItems || !["sales", "purchases"].includes(type)) return;

    let grandTotal = 0;

    watchedItems.forEach((it, idx) => {
      if (it?.itemType === "product") {
        const q = Number(it.quantity) || 0;
        const p = Number(it.pricePerUnit) || 0;
        const amt = +(q * p).toFixed(2);
        grandTotal += amt;

        // write back only if changed to avoid loops
        const current = Number(form.getValues(`items.${idx}.amount`)) || 0;
        if (current !== amt) {
          form.setValue(`items.${idx}.amount`, amt, { shouldValidate: false });
        }
      } else if (it?.itemType === "service") {
        // DO NOT overwrite service amounts; just read them
        const amt = Number(it.amount) || 0;
        grandTotal += amt;
      }
    });

    const curTotal = Number(form.getValues("totalAmount")) || 0;
    if (curTotal !== grandTotal) {
      form.setValue("totalAmount", grandTotal, { shouldValidate: true });
    }
  }, [watchedItems, type, form]);

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

    // Prefer new unified shape if it exists
    let itemsToSet =
      Array.isArray((transactionToEdit as any).items) &&
      (transactionToEdit as any).items.length
        ? (transactionToEdit as any).items.map((i: any) => ({
            itemType: i.itemType ?? (i.product ? "product" : "service"),
            product:
              typeof i.product === "object" ? i.product._id : i.product || "",
            service:
              typeof i.service === "object"
                ? i.service._id
                : i.service ||
                  (typeof i.serviceName === "object"
                    ? i.serviceName._id
                    : i.serviceName) ||
                  "",
            quantity: i.quantity ?? 1,
            unitType: i.unitType ?? "Piece",
            pricePerUnit: i.pricePerUnit ?? 0,
            description: i.description ?? "",
            amount:
              typeof i.amount === "number"
                ? i.amount
                : Number(i.quantity || 0) * Number(i.pricePerUnit || 0),
          }))
        : [
            // legacy: products[]
            ...((transactionToEdit as any).products || []).map((p: any) => ({
              itemType: "product" as const,
              product:
                typeof p.product === "object" ? p.product._id : p.product || "",
              quantity: p.quantity ?? 1,
              unitType: p.unitType ?? "Piece",
              pricePerUnit: p.pricePerUnit ?? 0,
              description: p.description ?? "",
              amount:
                typeof p.amount === "number"
                  ? p.amount
                  : Number(p.quantity || 0) * Number(p.pricePerUnit || 0),
            })),
            // legacy: service[] with serviceName
            ...((transactionToEdit as any).service || []).map((s: any) => ({
              itemType: "service" as const,
              service:
                typeof s.serviceName === "object"
                  ? s.serviceName._id
                  : s.serviceName || "",
              description: s.description ?? "",
              amount: Number(s.amount || 0),
            })),
          ];

    // fallbacks for sales/purchases
    if (
      (!itemsToSet || itemsToSet.length === 0) &&
      (transactionToEdit.type === "sales" ||
        transactionToEdit.type === "purchases")
    ) {
      itemsToSet = [PRODUCT_DEFAULT];
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

async function fetchInvoiceNumber(baseURL: string, token: string, companyId: string, date: Date, series: string = "sales") {
  const res = await fetch(`${baseURL}/api/invoices/issue-number`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ companyId, date, series }),
  });

  const data = await res.json();
  if (!res.ok || !data?.invoiceNumber) {
    throw new Error(data?.message || "Failed to issue invoice number");
  }
  return data.invoiceNumber as string;
}

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
        const transactionTypeEndpoint =
          transactionToEdit.type === "purchases"
            ? "/api/purchase"
            : `/api/${transactionToEdit.type}`;
        endpoint = `${transactionTypeEndpoint}/${transactionToEdit._id}`;
      }

      const productLines =
        values.items
          ?.filter((i) => i.itemType === "product")
          .map((i) => ({
            product: i.product, // ObjectId
            quantity: i.quantity,
            unitType: i.unitType,
            pricePerUnit: i.pricePerUnit,
            amount: i.amount, // optional if backend recomputes
            description: i.description ?? "",
          })) ?? [];

      const serviceLines =
        values.items
          ?.filter((i) => i.itemType === "service")
          .map((i) => ({
            service: i.service, // ObjectId of Service
            amount: i.amount,
            description: i.description ?? "",
          })) ?? [];

      const payload: any = { ...values };
      payload.products = productLines;
      payload.service = serviceLines;
      payload.amount = values.totalAmount; // if your model also stores amount
      payload.totalAmount = values.totalAmount;
      if (values.description) payload.description = values.description;
      if (values.narration) payload.narration = values.narration;

      if (values.type === "purchases" || values.type === "payment") {
        payload.vendor = values.party;
        delete payload.party;
      }
      if (values.type === "journal") {
        payload.debitAccount = values.fromAccount;
        payload.creditAccount = values.toAccount;
        if (values.description) payload.narration = values.description;
        payload.amount = values.totalAmount;
        delete payload.fromAccount;
        delete payload.toAccount;
        delete payload.party;
        delete payload.items;
        delete payload.referenceNumber;
      }

      // 🔑 NEW: issue invoice number only when creating a NEW sales transaction
      // Replace the invoice number issuance logic:
      if (
        !transactionToEdit &&
        (values.type === "sales" || values.type === "purchases")
      ) {
        const series = values.type === "sales" ? "sales" : "purchase";
        const invoiceNumber = await fetchInvoiceNumber(
          baseURL!,
          token,
          values.company,
          values.date,
          series
        );
        payload.invoiceNumber = invoiceNumber;
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
          data.message ||
            `Failed to ${transactionToEdit ? "update" : "create"} ${
              values.type
            } entry.`
        );
      }

      // If it's a sale and was successful, update the stock
      if (values.type === "sales" && values.items) {
        const stockItems = values.items
          .filter(
            (i) =>
              i.itemType === "product" && i.product && (i.quantity ?? 0) > 0
          )
          .map((i) => ({
            product: i.product!,
            quantity: Number(i.quantity) || 0,
          }));

        if (stockItems.length) {
          await updateStock(token, stockItems);
        }
      }

      // UI feedback
      const suffix =
        !transactionToEdit && values.type === "sales" && payload.invoiceNumber
          ? ` (Invoice #${payload.invoiceNumber})`
          : "";

      //send invoice on whatsapp directly

      toast({
        title: `Transaction ${transactionToEdit ? "Updated" : "Submitted"}!`,
        description: `Your ${values.type} entry has been successfully recorded.`,
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
    toast({
      title: "Product Created",
      description: `${newProduct.name} has been added.`,
    });
    setIsProductDialogOpen(false);
  };

  const handleServiceCreated = (newService: Service) => {
    setServices((prev) => [...prev, newService]);
    toast({
      title: "Service Created",
      description: `${
        newService.serviceName || (newService as any).serviceName
      } has been added.`,
    });
    setIsServiceDialogOpen(false);
  };

  const getPartyOptions = () => {
    if (type === "sales" || type === "receipt") {
      return parties.map((p) => ({
        value: p._id,
        label: String(p.name || ""),
      }));
    }
    if (type === "purchases" || type === "payment") {
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

  const renderSalesPurchasesFields = () => (
<div className="space-y-6">
  {/* Core Details */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full">
    {/* Company */}
    <FormField
      control={form.control}
      name="company"
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel>Company</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger className="w-full">
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

    {/* Date */}
    <FormField
      control={form.control}
      name="date"
      render={({ field }) => (
        <FormItem className="flex flex-col w-full">
          <FormLabel>Transaction Date</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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

  {/* Party */}
  <FormField
    control={form.control}
    name="party"
    render={({ field }) => (
      <FormItem className="w-full">
        <FormLabel>{partyLabel}</FormLabel>
        <Combobox
          options={partyOptions}
          value={field.value || ""}
          onChange={field.onChange}
          placeholder="Select or create..."
          searchPlaceholder="Search..."
          noResultsText="No results found."
          creatable
          onCreate={async (name) => {
            handleTriggerCreateParty(name);
            return Promise.resolve("");
          }}
        />
        <FormMessage />
      </FormItem>
    )}
  />

  <Separator />

  {/* Items Array */}
  <div className="space-y-6">
    <h3 className="text-base font-semibold">Items & Services</h3>

    {fields.map((item, index) => (
      <Card key={item.id} className="relative">
        <CardContent className="p-4 space-y-6">
          {/* Delete button */}
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

          {/* Product Item */}
          {item.itemType === "product" ? (
            <>
              <FormField
                control={form.control}
                name={`items.${index}.product`}
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Product</FormLabel>
                    <Combobox
                      options={productOptions}
                      value={field.value || ""}
                      onChange={(value) => field.onChange(value)}
                      placeholder="Select or create a product..."
                      searchPlaceholder="Search products..."
                      noResultsText="No product found."
                      creatable
                      onCreate={async (name) => {
                        handleTriggerCreateProduct(name);
                        return Promise.resolve();
                      }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Responsive grid for inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Quantity */}
                <FormField
                  control={form.control}
                  name={`items.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1"
                          className="w-full"
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

                {/* Unit */}
                <FormField
                  control={form.control}
                  name={`items.${index}.unitType`}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Unit</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {unitTypes.map((u) => (
                            <SelectItem key={u} value={u}>
                              {u}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Price/Unit */}
                <FormField
                  control={form.control}
                  name={`items.${index}.pricePerUnit`}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Price/Unit</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="w-full"
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

                {/* Amount */}
                <FormField
                  control={form.control}
                  name={`items.${index}.amount`}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="w-full bg-muted"
                          {...field}
                          readOnly
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </>
          ) : (
            /* Service Item */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`items.${index}.service`}
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Service</FormLabel>
                    <Combobox
                      options={serviceOptions}
                      value={field.value || ""}
                      onChange={(value) => field.onChange(value)}
                      placeholder="Select or create a service..."
                      searchPlaceholder="Search services..."
                      noResultsText="No service found."
                      creatable
                      onCreate={async (name) => {
                        const newServiceId = await handleTriggerCreateService(name);
                        return newServiceId || "";
                      }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount */}
              <FormField
                control={form.control}
                name={`items.${index}.amount`}
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="w-full"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? "" : e.target.valueAsNumber
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name={`items.${index}.description`}
                render={({ field }) => (
                  <FormItem className="w-full sm:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Brief service description"
                        className="w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </CardContent>
      </Card>
    ))}

    {/* Add Buttons */}
    <div className="flex flex-col sm:flex-row gap-3">
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
          })
        }
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Service
      </Button>
    </div>
  </div>

  <Separator />

  {/* Total Amount */}
  <div className="flex justify-end">
    <div className="w-full sm:max-w-sm space-y-2">
      <FormField
        control={form.control}
        name="totalAmount"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-lg font-bold">Total Amount</FormLabel>
            <FormControl>
              <Input
                type="number"
                className="text-lg font-bold h-12 text-right bg-muted w-full"
                {...field}
                readOnly
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </div>
</div>
  );

const renderReceiptPaymentFields = () => (
  <div className="flex flex-col max-h-[80vh] overflow-hidden">
    {/* Scrollable form content */}
    <div className="space-y-6 overflow-y-auto pr-2">
      {/* Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Company */}
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem className="w-full">
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

        {/* Transaction Date */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col w-full">
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

        {/* Party */}
        <FormField
          control={form.control}
          name="party"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>{partyLabel}</FormLabel>
              <Combobox
                options={partyOptions}
                value={field.value || ""}
                onChange={field.onChange}
                placeholder="Select or create..."
                searchPlaceholder="Search..."
                noResultsText="No results found."
                creatable
                onCreate={async (name) => {
                  handleTriggerCreateParty(name);
                  return Promise.resolve();
                }}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Amount */}
        <FormField
          control={form.control}
          name="totalAmount"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Reference Number */}
      <FormField
        control={form.control}
        name="referenceNumber"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>Reference Number (Optional)</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Cheque No, Ref #" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Description */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>Description / Narration</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe the transaction..."
                className="resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </div>
);



  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="contents">
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              <Tabs
                value={type}
                onValueChange={(value) => form.setValue("type", value as any)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="sales" disabled={!!transactionToEdit}>
                    Sales
                  </TabsTrigger>
                  <TabsTrigger value="purchases" disabled={!!transactionToEdit}>
                    Purchases
                  </TabsTrigger>
                  <TabsTrigger value="receipt" disabled={!!transactionToEdit}>
                    Receipt
                  </TabsTrigger>
                  <TabsTrigger value="payment" disabled={!!transactionToEdit}>
                    Payment
                  </TabsTrigger>
                  <TabsTrigger value="journal" disabled={!!transactionToEdit}>
                    Journal
                  </TabsTrigger>
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
        <DialogContent className="sm:max-w-2xl grid-rows-[auto,1fr,auto] max-h-[90vh] p-0">
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
      {/* <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Service</DialogTitle>
            <DialogDescription>
              Fill in the form to add a new service.
            </DialogDescription>
          </DialogHeader>
          <ServiceForm onSuccess={handleServiceCreated} />
        </DialogContent>
      </Dialog> */}
    </>
  );
}
