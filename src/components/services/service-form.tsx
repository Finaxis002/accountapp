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
import { Loader2, Trash2 } from "lucide-react";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import type { Service as ApiService } from "@/lib/types";

type ServiceInput = Partial<Pick<ApiService, "_id" | "serviceName">>;

interface ServiceFormProps {
  service?: ServiceInput;
  onSuccess: (service: ApiService) => void;
  onDelete?: (service: ServiceInput) => void; // optional delete callback
}

const formSchema = z.object({
  serviceName: z.string().min(2, "Service name is required."),
  sac: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function ServiceForm({
  service,
  onSuccess,
  onDelete,
}: ServiceFormProps) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceName: service?.serviceName || "",
      sac: (service as any)?.sac || "",
    },
  });

  React.useEffect(() => {
    if (service) {
      form.reset({
        serviceName: service.serviceName,
        sac: (service as any).sac,
      });
    }
  }, [service, form]);

  async function onSubmit(values: FormData) {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const url = service
        ? `${baseURL}/api/services/${service._id}`
        : `${baseURL}/api/services`;

      const method = service ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.message || `Failed to ${service ? "update" : "create"} service.`
        );
      }

      onSuccess(data.service || data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Operation Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!service?._id || !onDelete) return;
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this service?"
    );
    if (!confirmDelete) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const res = await fetch(`${baseURL}/api/services/${service._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete service.");
      }

      toast({
        title: "Service Deleted",
        description: `${service.serviceName} has been deleted.`,
      });

      onDelete(service);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
          <FormField
            control={form.control}
            name="serviceName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Annual Maintenance Contract"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sac"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SAC Code</FormLabel>
                <FormControl>
                  <Input placeholder="Enter SAC code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Responsive Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            {service && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="w-full sm:w-auto flex justify-center items-center"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto flex justify-center items-center"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {service ? "Save Changes" : "Create Service"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
