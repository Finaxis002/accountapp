
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
import { useRouter } from "next/navigation"
import Link from "next/link"
import { categorizeTransaction } from "@/ai/flows/categorize-transaction"

const formSchema = z.object({
  party: z.string().min(2, {
    message: "Party must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  amount: z.coerce.number().positive({
    message: "Amount must be a positive number.",
  }),
  date: z.date({
    required_error: "A date is required.",
  }),
  category: z.string({
    required_error: "Please select a category.",
  }),
  type: z.enum(["income", "expense"]),
});

const generalLedgerCategories = [
    "Sales", "Cost of Goods Sold", "Salaries and Wages", "Rent", "Utilities",
    "Marketing", "Software", "Office Supplies", "Meals & Entertainment", 
    "Travel", "Furniture & Equipment", "Miscellaneous"
];

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


export function TransactionForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCategorizing, setIsCategorizing] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      party: "",
      description: "",
      amount: 0,
      type: "expense"
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
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Transaction Submitted!",
        description: "Your transaction has been successfully recorded.",
        action: (
          <Button asChild variant="secondary" size="sm">
            <Link href="/invoices/inv_4">View Invoice</Link>
          </Button>
        ),
      });
      router.push("/transactions");
    }, 1500);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="party"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Party / Vendor</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Acme Inc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
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
              <FormDescription>
                This helps in categorizing the transaction.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select transaction type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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

        <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Transaction
        </Button>
      </form>
    </Form>
  )
}
