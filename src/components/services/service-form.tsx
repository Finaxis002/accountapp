
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
import type { Service } from "@/lib/types"

interface ServiceFormProps {
    service?: Service;
    onSuccess: (service: Service) => void;
}

const formSchema = z.object({
  serviceName: z.string().min(2, "Service name is required."),
});

type FormData = z.infer<typeof formSchema>;

export function ServiceForm({ service, onSuccess }: ServiceFormProps) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceName: service?.serviceName || "",
    },
  });
  
   React.useEffect(() => {
    if (service) {
      form.reset({
        serviceName: service.serviceName,
      });
    }
  }, [service, form]);

  async function onSubmit(values: FormData) {
    setIsSubmitting(true);
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Authentication token not found.");

        const url = service 
            ? `${baseURL}/api/services/${service._id}` 
            : `${baseURL}/api/services`;
        
        const method = service ? "PUT" : "POST";

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
            throw new Error(data.message || `Failed to ${service ? 'update' : 'create'} service.`);
        }
        
        onSuccess(data.service || data);

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <FormField
            control={form.control}
            name="serviceName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Service Name</FormLabel>
                <FormControl><Input placeholder="e.g. Annual Maintenance Contract" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {service ? "Save Changes" : "Create Service"}
            </Button>
        </div>
      </form>
    </Form>
  )
}
