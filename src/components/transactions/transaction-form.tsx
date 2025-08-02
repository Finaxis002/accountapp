
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import React from "react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { categorizeTransaction } from "@/ai/flows/categorize-transaction"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "../ui/separator"
import { ScrollArea } from "../ui/scroll-area"
import type { Company, Party, Product } from "@/lib/types"
import { Combobox } from "../ui/combobox"

const formSchema = z.object({
  type: z.enum(["sales", "purchases"]),
  companyId: z.string().min(1, "Please select a company."),
  partyName: z.string().min(2, "Party name must be at least 2 characters."),
  date: z.date({ required_error: "A date is required." }),
  amount: z.coerce.number().positive("Amount must be a positive number."),
  gstPercentage: z.coerce.number().min(0, "GST must be a non-negative number."),
  invoiceNumber: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters."),
  product: z.string({ required_error: "Please select a product." }),
});

const generalLedgerCategories = [
    "Sales", "Cost of Goods Sold", "Salaries and Wages", "Rent", "Utilities",
    "Marketing", "Software", "Office Supplies", "Meals & Entertainment", 
    "Travel", "Furniture & Equipment", "Miscellaneous"
];

interface TransactionFormProps {
    onFormSubmit: () => void;
}

export function TransactionForm({ onFormSubmit }: TransactionFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCategorizing, setIsCategorizing] = React.useState(false);

  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [parties, setParties] = React.useState<Party[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error("Authentication token not found.");
            
            const [companiesRes, partiesRes, productsRes] = await Promise.all([
                fetch("http://localhost:5000/api/companies/my", { headers: { "Authorization": `Bearer ${token}` } }),
                fetch("http://localhost:5000/api/parties", { headers: { "Authorization": `Bearer ${token}` } }),
                fetch("http://localhost:5000/api/products", { headers: { "Authorization": `Bearer ${token}` } })
            ]);

            if (!companiesRes.ok || !partiesRes.ok || !productsRes.ok) {
                throw new Error('Failed to fetch initial data.');
            }

            const companiesData = await companiesRes.json();
            const partiesData = await partiesRes.json();
            const productsData = await productsRes.json();

            setCompanies(companiesData);
            setParties(partiesData);
            setProducts(productsData);

            if (companiesData.length > 0) {
              form.setValue('companyId', companiesData[0]._id);
            }
            
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to load data", description: error instanceof Error ? error.message : "An unknown error occurred." });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      partyName: "",
      description: "",
      amount: undefined,
      gstPercentage: 0,
      type: "sales",
      invoiceNumber: `INV-${String(Date.now()).slice(-4)}`,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Authentication token not found.");

        const endpoint = values.type === 'sales' ? '/api/sales' : '/api/purchase';
        
        const payload = {
            ...values,
            invoiceType: values.type,
        };

        const res = await fetch(`http://localhost:5000${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || `Failed to create ${values.type} entry.`);
        }

        toast({
            title: "Transaction Submitted!",
            description: `Your ${values.type} entry has been successfully recorded.`,
            action: (
              <Button asChild variant="secondary" size="sm">
                <Link href={`/invoices/inv_4`}>View Invoice</Link>
              </Button>
            ),
        });
        onFormSubmit();

    } catch (error) {
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: error instanceof Error ? error.message : "An unknown error occurred."
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleCreateParty = async (partyName: string) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Authentication token not found.");
        const res = await fetch('http://localhost:5000/api/parties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name: partyName })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to create party.');
        const newParty = data.party;
        setParties(prev => [...prev, newParty]);
        form.setValue('partyName', newParty.name, { shouldValidate: true });
        toast({ title: "Party Created", description: `${newParty.name} has been added.` });
        return newParty;
    } catch (error) {
        toast({ variant: 'destructive', title: 'Failed to create party', description: error instanceof Error ? error.message : "Unknown error" });
        return null;
    }
  }
  
  const handleCreateProduct = async (productName: string) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Authentication token not found.");
        const res = await fetch('http://localhost:5000/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name: productName })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to create product.');
        const newProduct = data.product;
        setProducts(prev => [...prev, newProduct]);
        form.setValue('product', newProduct.name, { shouldValidate: true });
        toast({ title: "Product Created", description: `${newProduct.name} has been added.` });
        return newProduct;
    } catch (error) {
        toast({ variant: 'destructive', title: 'Failed to create product', description: error instanceof Error ? error.message : "Unknown error" });
        return null;
    }
  }

  const type = form.watch("type");

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-4">Loading form data...</p>
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="contents">
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-6 space-y-6">
            <Tabs value={type} onValueChange={(value) => form.setValue('type', value as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sales">Sales</TabsTrigger>
                <TabsTrigger value="purchases">Purchases</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="companyId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Company</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a company" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {companies.map(c => <SelectItem key={c._id} value={c._id}>{c.companyName}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="partyName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{type === 'sales' ? 'Customer Name' : 'Vendor Name'}</FormLabel>
                        <Combobox
                            options={parties.map(p => ({ value: p.name, label: p.name }))}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select or create a party..."
                            searchPlaceholder="Search parties..."
                            noResultsText="No party found."
                            creatable
                            onCreate={handleCreateParty}
                        />
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
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
                                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
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
                    name="invoiceNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Invoice / Bill #</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. INV-001" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
             <FormField
                control={form.control}
                name="product"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Product / Service</FormLabel>
                    <Combobox
                        options={products.map(p => ({ value: p.name, label: p.name }))}
                        value={field.value}
                        onChange={field.onChange}
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
            
            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Amount (before tax)</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="gstPercentage"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>GST (%)</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="0.0" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <div className="space-y-2">
                    <FormLabel>Total Amount</FormLabel>
                    <div className="flex h-10 w-full items-center rounded-md border border-input bg-secondary px-3 py-2 text-sm">
                        ${((form.watch('amount') || 0) * (1 + (form.watch('gstPercentage') || 0) / 100)).toFixed(2)}
                    </div>
                </div>
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end p-6 border-t">
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Transaction
            </Button>
        </div>
      </form>
    </Form>
  )
}
