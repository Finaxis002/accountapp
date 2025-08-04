
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
import { Loader2, Eye, EyeOff } from "lucide-react"
import React from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import type { Client } from "@/lib/types"
import { Separator } from "../ui/separator"
import { Switch } from "../ui/switch"
import { ScrollArea } from "../ui/scroll-area"

interface ClientFormProps {
    client?: Client;
    onFormSubmit?: () => void;
}

const baseSchema = z.object({
  contactName: z.string().min(2, "Contact name must be at least 2 characters."),
  clientUsername: z.string().min(4, "Username must be at least 4 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(10, "Phone number must be at least 10 characters."),
  maxCompanies: z.coerce.number().min(0, "Must be a non-negative number."),
  maxUsers: z.coerce.number().min(0, "Must be a non-negative number."),
  canSendInvoiceEmail: z.boolean(),
  canSendInvoiceWhatsapp: z.boolean(),
});

const createClientSchema = baseSchema.extend({
    password: z.string().min(6, "Password must be at least 6 characters."),
});

// For updates, we use the base schema which doesn't include the password.
const updateClientSchema = baseSchema;

type CreateClientForm = z.infer<typeof createClientSchema>;
type UpdateClientForm = z.infer<typeof updateClientSchema>;


export function ClientForm({ client, onFormSubmit }: ClientFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [eyeOpen, setEyeOpen] = React.useState(false);
  
  const formSchema = client ? updateClientSchema : createClientSchema;

  const form = useForm<CreateClientForm | UpdateClientForm>({
    resolver: zodResolver(client ? updateClientSchema : createClientSchema),
    defaultValues: {
      contactName: client?.contactName || "",
      clientUsername: client?.clientUsername || "",
      email: client?.email || "",
      phone: client?.phone || "",
      maxCompanies: client?.maxCompanies || 5,
      maxUsers: client?.maxUsers || 10,
      canSendInvoiceEmail: client?.canSendInvoiceEmail ?? true,
      canSendInvoiceWhatsapp: client?.canSendInvoiceWhatsapp ?? false,
      ...( !client && { password: "" }),
    },
  });

  React.useEffect(() => {
    form.reset({
      contactName: client?.contactName || "",
      clientUsername: client?.clientUsername || "",
      email: client?.email || "",
      phone: client?.phone || "",
      maxCompanies: client?.maxCompanies || 5,
      maxUsers: client?.maxUsers || 10,
      canSendInvoiceEmail: client?.canSendInvoiceEmail || true,
      canSendInvoiceWhatsapp: client?.canSendInvoiceWhatsapp || false,
      ...( !client && { password: "" }),
    });
  }, [client, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    const token = localStorage.getItem('token');
    if (!token) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to perform this action.",
        });
        setIsSubmitting(false);
        return;
    }

    try {
        const url = client 
            ? `http://localhost:5000/api/clients/${client._id}` 
            : "http://localhost:5000/api/clients";
        
        const method = client ? "PATCH" : "POST";

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
            throw new Error(data.message || `Failed to ${client ? 'update' : 'create'} client.`);
        }

        toast({
            title: `Client ${client ? 'Updated' : 'Created'}!`,
            description: `${values.contactName}'s details have been successfully saved.`,
        });
        if (onFormSubmit) onFormSubmit();

    } catch (error) {
        toast({
            variant: "destructive",
            title: "Operation Failed",
            description: error instanceof Error ? error.message : "Something went wrong.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="contents">
        <ScrollArea className="flex-1 ">
            <div className="space-y-6 px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={form.control}
                        name="clientUsername"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. johndoe" {...field} disabled={!!client} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {!client && (
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <div className="relative">
                                <Input
                                    type={eyeOpen ? "text" : "password"}
                                    placeholder="••••••••"
                                    {...field}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setEyeOpen((prev) => !prev)}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 focus:outline-none"
                                >
                                    {eyeOpen ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                )}
            
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="contact@company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

                <Separator />

                <div>
                    <h3 className="text-base font-medium mb-4">Permissions & Limits</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="maxCompanies"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Max Companies</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="maxUsers"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Max Users</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="canSendInvoiceEmail"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <FormLabel>Send Invoice via Email</FormLabel>
                                    <p className="text-xs text-muted-foreground">
                                        Allow this client to send invoices to their customers via email.
                                    </p>
                                </div>
                                <FormControl>
                                    <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="canSendInvoiceWhatsapp"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <FormLabel>Send Invoice via WhatsApp</FormLabel>
                                    <p className="text-xs text-muted-foreground">
                                        Allow this client to send invoices via WhatsApp integration.
                                    </p>
                                </div>
                                <FormControl>
                                    <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            </div>
        </ScrollArea>
        <div className="flex justify-end p-6 border-t bg-background">
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {client ? "Save Changes" : "Create Client"}
            </Button>
        </div>
      </form>
    </Form>
  )
}
