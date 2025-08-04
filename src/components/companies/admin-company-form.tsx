
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
import type { Company, Client } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

interface AdminCompanyFormProps {
    company?: Company;
    clients: Client[];
    onFormSubmit: () => void;
}

const formSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters."),
  registrationNumber: z.string().min(1, "Registration number is required."),
  address: z.string().min(5, "Address must be at least 5 characters."),
  companyOwner: z.string().min(2, "Owner name is required."),
  contactNumber: z.string().min(10, "A valid contact number is required."),
  gstin: z.string().length(15, "GSTIN must be 15 characters long.").optional().or(z.literal('')),
  companyType: z.string().min(2, "Company type is required."),
  client: z.string().min(1, "You must select a client.")
});

type FormData = z.infer<typeof formSchema>;

const defaultCompanyTypes = ["Services", "Manufacturing", "Trading", "Technology", "Retail"];

export function AdminCompanyForm({ company, clients, onFormSubmit }: AdminCompanyFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

 const getClientId = (client: string | Client | undefined) => {
  if (!client) return "";
  if (typeof client === "string") return client;
  return client._id;
};

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: company?.companyName || "",
      registrationNumber: company?.registrationNumber || "",
      address: company?.address || "",
      companyOwner: company?.companyOwner || "",
      contactNumber: company?.contactNumber || "",
      gstin: company?.gstin || "",
      companyType: company?.companyType || "",
      client: getClientId(company?.client),
    },
  });

  async function onSubmit(values: FormData) {
    setIsSubmitting(true);
    
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Authentication token not found.");

        const url = company 
            ? `http://localhost:5000/api/companies/${company._id}` 
            : "http://localhost:5000/api/companies";
        
        const method = company ? "PUT" : "POST";

        const { client, ...restOfValues } = values;
        const submissionBody = {
            ...restOfValues,
            selectedClient: client
        };

        const res = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(submissionBody),
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || `Failed to ${company ? 'update' : 'create'} company.`);
        }

        toast({
            title: company ? "Company Updated!" : "Company Created!",
            description: `${values.companyName} has been successfully saved.`,
        });
        
        onFormSubmit();

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
  
  const clientOptions = clients.map(client => ({
      value: client._id,
      label: `${client.contactName} (${client.email})`
  }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
            control={form.control}
            name="client"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Assign to Client</FormLabel>
                 <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a client to assign this company" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {clients.map(client => (
                        <SelectItem key={client._id} value={client._id}>
                            {client.contactName} - ({client.email})
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. Innovate Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="registrationNumber"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Registration Number</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. U74999DL2015PTC284390" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                    <Input placeholder="e.g. 123 Business Bay, Suite 101" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="companyOwner"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Company Owner</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. +1 555-555-5555" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="gstin"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>GSTIN (Optional)</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. 22AAAAA0000A1Z5" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="companyType"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Company Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a company type" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {defaultCompanyTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {company ? "Save Changes" : "Create Company"}
            </Button>
        </div>
      </form>
    </Form>
  )
}
