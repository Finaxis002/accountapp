
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

const formSchema = z.object({
  type: z.enum(["sales", "purchases", "general"]),
  companyName: z.string().min(1, "Please select a company."),
  party: z.string().min(2, "Party name must be at least 2 characters."),
  date: z.date({ required_error: "A date is required." }),
  amount: z.coerce.number().positive("Amount must be a positive number."),
  gst: z.coerce.number().min(0, "GST must be a non-negative number."),
  invoiceNumber: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters."),
  category: z.string({ required_error: "Please select a category." }),
});

const generalLedgerCategories = [
    "Sales", "Cost of Goods Sold", "Salaries and Wages", "Rent", "Utilities",
    "Marketing", "Software", "Office Supplies", "Meals & Entertainment", 
    "Travel", "Furniture & Equipment", "Miscellaneous"
];

const companies = ["TechCorp Solutions", "Green Energy Ltd", "Fashion Forward Inc"];

interface TransactionFormProps {
    onFormSubmit: () => void;
}

const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
  
    const debounced = (...args: Parameters<F>) => {
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
      timeout = setTimeout(() => func(...args), waitFor);
    };
  
    return debounced as (...args: Parameters<F>) => void;
};


export function TransactionForm({ onFormSubmit }: TransactionFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCategorizing, setIsCategorizing] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      party: "",
      description: "",
      amount: 0,
      gst: 0,
      type: "sales",
      companyName: companies[0],
      invoiceNumber: `INV-${String(Date.now()).slice(-4)}`,
    },
  });

  const handleDescriptionChange = React.useCallback(
    async (description: string) => {
      if (description.length > 10) {
        setIsCategorizing(true);
        try {
          const result = await categorizeTransaction({ description });
          if (result && generalLedgerCategories.includes(result.suggestedCategory)) {
            form.setValue("category", result.suggestedCategory, { shouldValidate: true });
          }
        } catch (error) {
          console.error("AI categorization failed:", error);
          toast({
            variant: "destructive",
            title: "AI Categorization Failed",
            description: "Could not suggest a category. Please select one manually.",
          });
        } finally {
          setIsCategorizing(false);
        }
      }
    },
    [form, toast]
  );
  
  const debouncedDescriptionChange = React.useMemo(
    () => debounce(handleDescriptionChange, 500),
    [handleDescriptionChange]
  );

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    console.log(values);
    
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Transaction Submitted!",
        description: "Your transaction has been successfully recorded.",
        action: (
          <Button asChild variant="secondary" size="sm">
            <Link href={`/invoices/inv_4`}>View Invoice</Link>
          </Button>
        ),
      });
      onFormSubmit();
    }, 1500);
  }

  const type = form.watch("type");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="contents">
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-6 space-y-6">
            <Tabs value={type} onValueChange={(value) => form.setValue('type', value as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="sales">Sales</TabsTrigger>
                <TabsTrigger value="purchases">Purchases</TabsTrigger>
                <TabsTrigger value="general">General Journal</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Company</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a company" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {companies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                        <FormLabel>{type === 'sales' ? 'Customer Name' : 'Vendor Name'}</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. Acme Inc." {...field} />
                        </FormControl>
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Monthly software subscription for design tools"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        debouncedDescriptionChange(e.target.value);
                      }}
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
                    name="gst"
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
                        ${((form.watch('amount') || 0) * (1 + (form.watch('gst') || 0) / 100)).toFixed(2)}
                    </div>
                </div>
            </div>

            <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
                <FormItem>
                <FormLabel>General Ledger Category</FormLabel>
                <div className="relative">
                    <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {generalLedgerCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    {isCategorizing && (
                        <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                </div>
                <FormDescription>
                    The AI can help suggest a category based on the description.
                </FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
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
