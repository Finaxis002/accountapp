"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "../ui/scroll-area";
import type { Company, Party, Product, Vendor, Transaction } from "@/lib/types";
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

const formSchema = z
  .object({
    type: z.enum(["sales", "purchases", "receipt", "payment", "journal"]),
    company: z.string().min(1, "Please select a company."),
    party: z.string().optional(),
    date: z.date({ required_error: "A date is required." }),
    amount: z.coerce.number().positive("Amount must be a positive number."),
    quantity: z.coerce.number().optional(),
    unitType: z.enum(unitTypes).default("Piece").optional(),
    pricePerUnit: z.coerce.number().optional(),
    description: z.string().min(1, "Description is required.").optional(),
    product: z.string().optional(),
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
        return !!data.product;
      }
      return true;
    },
    {
      message: "Product is required for sales or purchases.",
      path: ["product"],
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
  )
  .refine(
    (data) => {
      if (data.type === "sales" || data.type === "purchases") {
        return data.quantity !== undefined && data.quantity > 0;
      }
      return true;
    },
    {
      message: "Quantity is required and must be positive.",
      path: ["quantity"],
    }
  )
  .refine(
    (data) => {
      if (data.type === "sales" || data.type === "purchases") {
        return data.pricePerUnit !== undefined && data.pricePerUnit > 0;
      }
      return true;
    },
    {
      message: "Price is required and must be positive.",
      path: ["pricePerUnit"],
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

  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [parties, setParties] = React.useState<Party[]>([]);
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { selectedCompanyId } = useCompany();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      party: "",
      description: "",
      amount: 0,
      quantity: 1,
      pricePerUnit: 0,
      unitType: "Piece",
      type: "sales",
      product: "",
      referenceNumber: "",
      fromAccount: "",
      toAccount: "",
      narration: "",
      company: selectedCompanyId || "",
      date: new Date(),
    },
  });

  const type = form.watch("type");
  const quantity = form.watch("quantity");
  const pricePerUnit = form.watch("pricePerUnit");

  React.useEffect(() => {
    if (type === "sales" || type === "purchases") {
      const totalAmount = (quantity || 0) * (pricePerUnit || 0);
      form.setValue("amount", totalAmount, { shouldValidate: true });
    }
  }, [quantity, pricePerUnit, type, form]);

  const fetchInitialData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const [companiesRes, partiesRes, productsRes, vendorsRes] =
        await Promise.all([
          fetch(`${baseURL}/api/companies/my`, {
            headers: { Authorization: `Bearer ${token}` },
          }),

          fetch("${baseURL}/api/parties", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("${baseURL}/api/products", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("${baseURL}/api/vendors", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      if (
        !companiesRes.ok ||
        !partiesRes.ok ||
        !productsRes.ok ||
        !vendorsRes.ok
      ) {
        throw new Error("Failed to fetch initial form data.");
      }

      const companiesData = await companiesRes.json();
      const partiesData = await partiesRes.json();
      const productsData = await productsRes.json();
      const vendorsData = await vendorsRes.json();

      setCompanies(companiesData);
      setParties(
        Array.isArray(partiesData) ? partiesData : partiesData.parties || []
      );
      setProducts(
        Array.isArray(productsData) ? productsData : productsData.products || []
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
    if (transactionToEdit) {
      let partyId: string | undefined;
      if (transactionToEdit.party) {
        partyId =
          typeof transactionToEdit.party === "object"
            ? transactionToEdit.party._id
            : transactionToEdit.party;
      } else if (transactionToEdit.vendor) {
        partyId =
          typeof transactionToEdit.vendor === "object"
            ? transactionToEdit.vendor._id
            : transactionToEdit.vendor;
      }

      const price =
        transactionToEdit.pricePerUnit ||
        transactionToEdit.amount / (transactionToEdit.quantity || 1);

      form.reset({
        type: transactionToEdit.type,
        company:
          typeof transactionToEdit.company === "object"
            ? transactionToEdit.company._id
            : transactionToEdit.company,
        date: new Date(transactionToEdit.date),
        amount: transactionToEdit.amount,
        quantity: transactionToEdit.quantity,
        pricePerUnit: price,
        unitType: transactionToEdit.unitType || "Piece",
        description: transactionToEdit.description || "",
        narration: transactionToEdit.narration || "",
        party: partyId,
        product:
          typeof transactionToEdit.product === "object"
            ? transactionToEdit.product?._id
            : transactionToEdit.product,
        referenceNumber: transactionToEdit.referenceNumber,
        fromAccount: transactionToEdit.debitAccount,
        toAccount: transactionToEdit.creditAccount,
      });
    } else {
      form.reset({
        party: "",
        description: "",
        amount: 0,
        quantity: 1,
        pricePerUnit: 0,
        unitType: "Piece",
        type: type,
        product: "",
        referenceNumber: "",
        fromAccount: "",
        toAccount: "",
        narration: "",
        company: selectedCompanyId || form.getValues("company"),
        date: new Date(),
      });
    }
  }, [transactionToEdit, type, form, selectedCompanyId]);

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
            : `/api/${transactionToEdit.type}s`;
        endpoint = `${transactionTypeEndpoint}/${transactionToEdit._id}`;
      }

      const payload: any = { ...values };
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
        delete payload.fromAccount;
        delete payload.toAccount;
        delete payload.party;
        delete payload.product;
        delete payload.referenceNumber;
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

  const handleTriggerCreateProduct = () => {
    setIsProductDialogOpen(true);
  };

  const handleProductCreated = (newProduct: Product) => {
    setProducts((prev) => [...prev, newProduct]);
    form.setValue("product", newProduct._id, { shouldValidate: true });
    toast({
      title: "Product Created",
      description: `${newProduct.name} has been added.`,
    });
    setIsProductDialogOpen(false);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-4">Loading form data...</p>
      </div>
    );
  }

  const renderSharedFields = (
    includeParty: boolean,
    includeProduct?: boolean,
    includeReference?: boolean,
    includeQuantityAndPrice?: boolean
  ) => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-base font-medium pb-2 border-b">Core Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
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
          {includeParty && (
            <FormField
              control={form.control}
              name="party"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{partyLabel}</FormLabel>
                  <Combobox
                    options={partyOptions}
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder={`Select or create...`}
                    searchPlaceholder={`Search...`}
                    noResultsText={`No results found.`}
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
          )}

          {includeQuantityAndPrice && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unitType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
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
              </div>
              <FormField
                control={form.control}
                name="pricePerUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price per Unit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.00"
                    {...field}
                    disabled={includeQuantityAndPrice}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {includeReference && (
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
          )}
        </div>
      </div>

      {includeProduct && (
        <div className="space-y-2">
          <h3 className="text-base font-medium pb-2 border-b">Item Details</h3>
          <div className="pt-2 space-y-4">
            <FormField
              control={form.control}
              name="product"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product / Service</FormLabel>
                  <Combobox
                    options={products.map((p) => ({
                      value: p._id,
                      label: p.name,
                    }))}
                    value={field.value || ""}
                    onChange={(value) => {
                      field.onChange(value);
                    }}
                    placeholder="Select or create a product..."
                    searchPlaceholder="Search products..."
                    noResultsText="No product found."
                    creatable
                    onCreate={async () => {
                      handleTriggerCreateProduct();
                      return Promise.resolve();
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-base font-medium pb-2 border-b">
          Additional Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Description / Narration</FormLabel>
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
                  {renderSharedFields(true, true, false, true)}
                </TabsContent>
                <TabsContent value="purchases" className="pt-6">
                  {renderSharedFields(true, true, false, true)}
                </TabsContent>
                <TabsContent value="receipt" className="pt-6">
                  {renderSharedFields(true, false, true, false)}
                </TabsContent>
                <TabsContent value="payment" className="pt-6">
                  {renderSharedFields(true, false, true, false)}
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
                          name="amount"
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
              Fill in the form to add a new product or service.
            </DialogDescription>
          </DialogHeader>
          <ProductForm onSuccess={handleProductCreated} />
        </DialogContent>
      </Dialog>
    </>
  );
}
