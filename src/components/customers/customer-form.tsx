
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import React from "react"
import { useToast } from "@/hooks/use-toast"
import type { Party } from "@/lib/types"

interface CustomerFormProps {
    customer?: Party;
    initialName?: string;
    onSuccess: (customer: Party) => void;
}

const formSchema = z.object({
  name: z.string().min(2, "Customer name is required."),
  contactNumber: z.string().optional(),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  address: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function CustomerForm({ customer, initialName, onSuccess }: CustomerFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: customer?.name || initialName || "",
      contactNumber: customer?.contactNumber || "",
      email: customer?.email || "",
      address: customer?.address || "",
    },
  });

  async function onSubmit(values: FormData) {
    setIsSubmitting(true);
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Authentication token not found.");

        const url = customer 
            ? `http://localhost:5000/api/parties/${customer._id}` 
            : "http://localhost:5000/api/parties";
        
        const method = customer ? "PUT" : "POST";

        const res = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(values),
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || `Failed to ${customer ? 'update' : 'create'} customer.`);
        }
        
        onSuccess(data.party);

    } catch (error) {
       toast({
            variant: "destructive",
            title: "Operation Failed",
            description: error instanceof Error ? error.message : "An unknown error occurred.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="contents">
        <div className="space-y-4 p-6">
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl><Input placeholder="e.g. John Doe" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="contactNumber" render={({ field }) => (<FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input placeholder="e.g. 9876543210" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="e.g. john.doe@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input placeholder="e.g. 456 Park Avenue" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>

        <div className="flex justify-end p-6 border-t bg-background">
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {customer ? "Save Changes" : "Create Customer"}
            </Button>
        </div>
      </form>
    </Form>
  )
}
