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
import type { Company, Party, Product, Vendor } from "@/lib/types";
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

const formSchema = z
  .object({
    type: z.enum(["sales", "purchases", "voucher"]),
    company: z.string().min(1, "Please select a company."),
    party: z.string().optional(),
    date: z.date({ required_error: "A date is required." }),
    amount: z.coerce.number().positive("Amount must be a positive number."),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters."),
    product: z.string().optional(),
    voucher: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "sales" || data.type === "purchases") {
        return !!data.party;
      }
      return true;
    },
    {
      message: "Party name is required for sales or purchases.",
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
  );

interface TransactionFormProps {
  onFormSubmit: () => void;
}

export function TransactionForm({ onFormSubmit }: TransactionFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isEntityDialogOpen, setIsEntityDialogOpen] = React.useState(false);
  const [newEntityName, setNewEntityName] = React.useState("");

  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [parties, setParties] = React.useState<Party[]>([]);
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      party: "",
      description: "",
      amount: 0,
      type: "sales",
      voucher: "",
    },
  });

  const fetchInitialData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const [companiesRes, partiesRes, productsRes, vendorsRes] =
        await Promise.all([
          fetch("http://localhost:5000/api/companies/my", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/parties", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/products", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/vendors", {
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

      console.log("vendors data :", vendorsData)

      setCompanies(companiesData);
      setParties(
        Array.isArray(partiesData) ? partiesData : partiesData.parties || []
      );
      setProducts(productsData);
      setVendors(
        Array.isArray(vendorsData) ? vendorsData : vendorsData.vendors || []
      );

      if (companiesData.length > 0) {
        form.setValue("company", companiesData[0]._id);
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
  }, [toast, form]);

  React.useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const endpoint =
        values.type === "sales"
          ? "/api/sales"
          : values.type === "purchases"
          ? "/api/purchase"
          : "/api/vouchers"; // Assuming a voucher endpoint

      const { company, ...rest } = values;
      const payload: any = {
        ...rest,
        companyId: company,
      };

      if (values.type === "purchases") {
        payload.vendor = values.party;
      }

      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || `Failed to create ${values.type} entry.`
        );
      }

      toast({
        title: "Transaction Submitted!",
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

  const handleTriggerCreateEntity = (name: string) => {
    setNewEntityName(name);
    setIsEntityDialogOpen(true);
  };

  const handleEntityCreated = (newEntity: Party | Vendor) => {
    const entityId = newEntity._id;
    const entityName = newEntity.name || newEntity.vendorName;

    if (form.getValues("type") === "sales") {
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
        form.getValues("type") === "sales" ? "Customer" : "Vendor"
      } Created`,
      description: `${entityName} has been added.`,
    });
    setIsEntityDialogOpen(false);
  };

  const handleCreateProduct = async (productName: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const res = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: productName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create product.");
      const newProduct = data.product;
      setProducts((prev) => [...prev, newProduct]);
      form.setValue("product", newProduct._id, { shouldValidate: true });
      toast({
        title: "Product Created",
        description: `${newProduct.name} has been added.`,
      });
      return newProduct;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create product",
        description: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  };

  const type = form.watch("type");

  React.useEffect(() => {
    form.reset({
      party: "",
      description: "",
      amount: 0,
      type: type,
      voucher: "",
      company: form.getValues("company"),
      date: undefined,
    });
  }, [type, form]);

  const currentParties = type === "sales" ? parties : vendors;
  const partyOptions = (
    Array.isArray(currentParties) ? currentParties : []
  ).map((p) => ({
    value: p._id,
    label: String(p.name || p.vendorName || ""),
  }));
  const partyLabel = type === "sales" ? "Customer Name" : "Vendor Name";

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-4">Loading form data...</p>
      </div>
    );
  }

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
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="sales">Sales</TabsTrigger>
                  <TabsTrigger value="purchases">Purchases</TabsTrigger>
                  <TabsTrigger value="voucher">Voucher</TabsTrigger>
                </TabsList>
                <TabsContent value="voucher" className="pt-6 space-y-4">
                  <h3 className="text-base font-medium pb-2 border-b">
                    Voucher Details
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
                                  {c.companyName}
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
                          <FormLabel>Voucher Date</FormLabel>
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
                    <FormField
                      control={form.control}
                      name="voucher"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Voucher Number (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. VCH-00123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g. Petty cash for office supplies"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {(type === "sales" || type === "purchases") && (
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
                                    {c.companyName}
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
                        name="party"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{partyLabel}</FormLabel>
                            <Combobox
                              options={partyOptions}
                              value={field.value || ""}
                              onChange={field.onChange}
                              placeholder={`Select or create a ${
                                type === "sales" ? "customer" : "vendor"
                              }...`}
                              searchPlaceholder={`Search ${
                                type === "sales" ? "customers" : "vendors"
                              }...`}
                              noResultsText={`No ${
                                type === "sales" ? "customer" : "vendor"
                              } found.`}
                              creatable
                              onCreate={async (name) => {
                                handleTriggerCreateEntity(name);
                                return Promise.resolve(); // or return something meaningful if needed
                              }}
                            />
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
                      <FormField
                        control={form.control}
                        name="voucher"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Voucher Number (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. VCH-00123" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-medium pb-2 border-b">
                      Item Details
                    </h3>
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
                              onCreate={handleCreateProduct}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="e.g. Monthly software subscription for design tools"
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
              )}
            </div>
          </ScrollArea>
          <div className="flex justify-end p-6 border-t bg-background">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Transaction
            </Button>
          </div>
        </form>
      </Form>
      <Dialog open={isEntityDialogOpen} onOpenChange={setIsEntityDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Create New {type === "sales" ? "Customer" : "Vendor"}
            </DialogTitle>
            <DialogDescription>
              Fill out the form below to add a new{" "}
              {type === "sales" ? "customer" : "vendor"} to your list.
            </DialogDescription>
          </DialogHeader>
          {type === "sales" ? (
            <CustomerForm
              initialName={newEntityName}
              onSuccess={handleEntityCreated}
            />
          ) : (
            <VendorForm
              initialName={newEntityName}
              onSuccess={handleEntityCreated}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
