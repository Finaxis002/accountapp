
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
import type { Vendor } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Switch } from "../ui/switch"
import { ScrollArea } from "../ui/scroll-area"

interface VendorFormProps {
    vendor?: Vendor;
    initialName?: string;
    onSuccess: (vendor: Vendor) => void;
}

const gstRegistrationTypes = ["Regular", "Composition", "Unregistered", "Consumer", "Overseas", "Special Economic Zone", "Unknown"] as const;

const formSchema = z.object({
  vendorName: z.string().min(2, "Vendor name is required."),
  contactNumber: z.string().optional(),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  gstin: z.string().length(15, "GSTIN must be 15 characters.").optional().or(z.literal('')),
  gstRegistrationType: z.enum(gstRegistrationTypes).default("Unregistered"),
  pan: z.string().length(10, "PAN must be 10 characters.").optional().or(z.literal('')),
  isTDSApplicable: z.boolean().default(false),
  tdsRate: z.coerce.number().optional(),
  tdsSection: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function VendorForm({ vendor, initialName, onSuccess }: VendorFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vendorName: vendor?.vendorName || initialName || "",
      contactNumber: vendor?.contactNumber || "",
      email: vendor?.email || "",
      address: vendor?.address || "",
      city: vendor?.city || "",
      state: vendor?.state || "",
      gstin: vendor?.gstin || "",
      gstRegistrationType: vendor?.gstRegistrationType || "Unregistered",
      pan: vendor?.pan || "",
      isTDSApplicable: vendor?.isTDSApplicable || false,
      tdsRate: vendor?.tdsRate || 0,
      tdsSection: vendor?.tdsSection || "",
    },
  });

  const isTDSApplicable = form.watch("isTDSApplicable");

  async function onSubmit(values: FormData) {
    setIsSubmitting(true);
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Authentication token not found.");

        const url = vendor 
            ? `http://localhost:5000/api/vendors/${vendor._id}` 
            : "http://localhost:5000/api/vendors";
        
        const method = vendor ? "PUT" : "POST";

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
            throw new Error(data.message || `Failed to ${vendor ? 'update' : 'create'} vendor.`);
        }
        
        onSuccess(data.vendor);

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
        <ScrollArea className="max-h-[60vh] flex-1">
            <div className="space-y-4 px-6 pb-6">
                <FormField
                    control={form.control}
                    name="vendorName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Vendor Name</FormLabel>
                        <FormControl><Input placeholder="e.g. Acme Supplies" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="contactNumber" render={({ field }) => (<FormItem><FormLabel>Mobile Number / Whatsapp</FormLabel><FormControl><Input placeholder="e.g. 9876543210" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email ID</FormLabel><FormControl><Input type="email" placeholder="e.g. contact@acme.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input placeholder="e.g. 123 Industrial Area" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g. Mumbai" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="state" render={({ field }) => (<FormItem><FormLabel>State</FormLabel><FormControl><Input placeholder="e.g. Maharashtra" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="gstin" render={({ field }) => (<FormItem><FormLabel>GSTIN</FormLabel><FormControl><Input placeholder="15-digit GSTIN" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="pan" render={({ field }) => (<FormItem><FormLabel>PAN</FormLabel><FormControl><Input placeholder="10-digit PAN" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                 <FormField
                    control={form.control}
                    name="gstRegistrationType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>GST Registration Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {gstRegistrationTypes.map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="isTDSApplicable"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <FormLabel>TDS Applicable or Not</FormLabel>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )}
                />
                {/* {isTDSApplicable && (
                    <div className="grid grid-cols-2 gap-4 p-4 border rounded-md">
                         <FormField
                            control={form.control}
                            name="tdsRate"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>TDS Rate (%)</FormLabel>
                                <FormControl><Input type="number" placeholder="e.g. 10" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="tdsSection"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>TDS Section</FormLabel>
                                <FormControl><Input placeholder="e.g. 194J" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )} */}
            </div>
        </ScrollArea>
        <div className="flex justify-end p-6 border-t bg-background">
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {vendor ? "Save Changes" : "Create Vendor"}
            </Button>
        </div>
      </form>
    </Form>
  )
}
