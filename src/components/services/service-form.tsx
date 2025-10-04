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
import { searchSACCodes, type SACCode } from "@/lib/sacService";

type ServiceInput = Partial<Pick<ApiService, "_id" | "serviceName">>;

interface ServiceFormProps {
  service?: ServiceInput;
  onSuccess: (service: ApiService) => void;
  onDelete?: (service: ServiceInput) => void;
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
  const [sacSuggestions, setSacSuggestions] = React.useState<SACCode[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceName: service?.serviceName || "",
      sac: (service as any)?.sac || "",
    },
  });

  // Debounced search for SAC codes
  React.useEffect(() => {
    const sacValue = form.watch("sac");
    
    const timer = setTimeout(() => {
      if (sacValue && sacValue.length >= 2) {
        setIsLoadingSuggestions(true);
        const results = searchSACCodes(sacValue);
        setSacSuggestions(results);
        setShowSuggestions(true);
        setIsLoadingSuggestions(false);
      } else {
        setShowSuggestions(false);
        setSacSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [form.watch("sac")]);

  const sacValue = form.watch("sac") ?? "";

  const handleSACSelect = (sacCode: SACCode) => {
    form.setValue("sac", sacCode.code);
    setShowSuggestions(false);
  };

  const handleSACInputBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

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
                  <div className="relative">
                    <div className="relative">
                      <Input 
                        placeholder="Search SAC code (e.g., 9954)"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setShowSuggestions(true);
                        }}
                        onBlur={handleSACInputBlur}
                        onFocus={() => {
                          if (field.value && field.value.length >= 2) {
                            setShowSuggestions(true);
                          }
                        }}
                      />
                      {isLoadingSuggestions && (
                        <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    
                    {/* Suggestions Dropdown */}
                    {showSuggestions && sacSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                        {sacSuggestions.map((sac) => (
                          <div
                            key={sac.code}
                            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer border-b dark:border-gray-700 last:border-b-0 transition-colors"
                            onClick={() => handleSACSelect(sac)}
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            <div className="flex justify-between items-start">
                              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                {sac.code}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                SAC
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                              {sac.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* No results message */}
                    {showSuggestions && sacValue && sacValue.length >= 2 &&
                     sacSuggestions.length === 0 && !isLoadingSuggestions && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-3">
                        <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                          No matching SAC codes found.
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
                          Please check the code or enter manually.
                        </div>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Start typing 2+ characters to see SAC code suggestions
                </p>
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