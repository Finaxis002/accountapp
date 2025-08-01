
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Eye, EyeOff } from "lucide-react"
import React from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import type { Client } from "@/lib/types"

interface ClientFormProps {
    client?: Client;
    onFormSubmit?: () => void;
}

const formSchema = z.object({
  contactName: z.string().min(2, "Contact name must be at least 2 characters."),
  clientUsername: z.string().min(4, "Username must be at least 4 characters."),
  password: z.string().min(6, "Password must be at least 6 characters.").optional(),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(10, "Phone number must be at least 10 characters."),
});

const baseSchema = z.object({
  contactName: z.string().min(2, "Contact name must be at least 2 characters."),
  clientUsername: z.string().min(4, "Username must be at least 4 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(10, "Phone number must be at least 10 characters."),
});

const createSchema = baseSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const editSchema = baseSchema; 

export function ClientForm({ client, onFormSubmit }: ClientFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [eyeOpen, setEyeOpen] = React.useState(false);

 const form = useForm<z.infer<typeof createSchema | typeof editSchema>>({
    resolver: zodResolver(client ? editSchema : createSchema),
    defaultValues: {
      contactName: client?.contactName || "",
      clientUsername: client?.clientUsername || "",
      password: "",
      email: client?.email || "",
      phone: client?.phone || "",
    },
  });

  React.useEffect(() => {
    form.reset({
      contactName: client?.contactName || "",
      clientUsername: client?.clientUsername || "",
      password: "",
      email: client?.email || "",
      phone: client?.phone || "",
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

    if (client) {
      try {
        const res = await fetch(`http://localhost:5000/api/clients/${client._id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                contactName: values.contactName,
                email: values.email,
                phone: values.phone,
            }),
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || "Failed to update client.");
        }

        toast({
            title: "Client Updated!",
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
    } else {
      // Create new client
      try {
        const res = await fetch("http://localhost:5000/api/clients", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            clientUsername: values.clientUsername,
            password: values.password,
            contactName: values.contactName,
            phone: values.phone,
            email: values.email,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to create client.");
        }
        
        toast({
          title: "Client Created!",
          description: `${values.contactName} has been successfully added.`,
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
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        {!client ? (
           <>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="clientUsername"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. johndoe" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
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
            </div>
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
           </>
        ) : (
            <>
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
                                <Input placeholder="e.g. johndoe" {...field} disabled />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
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
            </>
        )}

        <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {client ? "Save Changes" : "Create Client"}
            </Button>
        </div>
      </form>
    </Form>
  )
}
