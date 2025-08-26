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
import { Loader2 } from "lucide-react";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/lib/types";

interface ProductFormProps {
  productType?: string;
  product?: Product;
  onSuccess: (product: Product) => void;
  initialName?: string;
}

const formSchema = z.object({
  name: z.string().min(2, "Product name is required."),
  stocks: z.coerce.number().min(0, "Stock cannot be negative.").optional(),
});

type FormData = z.infer<typeof formSchema>;

export function ProductForm({
  product,
  onSuccess,
  initialName,
  productType,
}: ProductFormProps) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name || initialName || "",
      stocks: product?.stocks ?? 0,
    },
  });

  async function onSubmit(values: FormData) {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const url = product
        ? `${baseURL}/api/products/${product._id}`
        : `${baseURL}/api/products`;

      const method = product ? "PUT" : "POST";

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
          data.message || `Failed to ${product ? "update" : "create"} product.`
        );
      }

      onSuccess(data.product);
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

  return (
    <div
      className="
        w-full
        max-w-xs
        sm:max-w-sm
        md:max-w-md
        lg:max-w-lg
        mx-auto
      "
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product/Service Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Website Development" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stocks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Opening Stock</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {product ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
