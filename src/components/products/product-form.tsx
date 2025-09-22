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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
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
  unit: z.string().min(1, "Unit is required.").optional(),
  customUnit: z.string().optional(),
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
  const [existingUnits, setExistingUnits] = React.useState<any[]>([]);
  const [unitOpen, setUnitOpen] = React.useState(false);

  const handleDeleteUnit = async (unitId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const res = await fetch(`${baseURL}/api/units/${unitId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete unit");
      }

      // Refresh units
      const unitsRes = await fetch(`${baseURL}/api/units`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (unitsRes.ok) {
        const units = await unitsRes.json();
        setExistingUnits(units);
      }

      toast({
        title: "Unit deleted",
        description: "The unit has been removed successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  };

  React.useEffect(() => {
    const fetchUnits = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${baseURL}/api/units`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const units = await res.json();
          setExistingUnits(units);
        }
      } catch (error) {
        console.error("Failed to fetch units:", error);
      }
    };
    fetchUnits();
  }, [baseURL]);

  const getDefaultUnit = (productUnit?: string) => {
    const standardUnits = ["Piece", "Kg", "Litre", "Box", "Meter", "Dozen", "Pack"];
    const existingUnitNames = existingUnits.map(u => u.name);
    if (!productUnit || standardUnits.includes(productUnit) || existingUnitNames.includes(productUnit)) {
      return productUnit || "Piece";
    }
    return "Other";
  };

  const getDefaultCustomUnit = (productUnit?: string) => {
    const standardUnits = ["Piece", "Kg", "Litre", "Box", "Meter", "Dozen", "Pack"];
    const existingUnitNames = existingUnits.map(u => u.name);
    if (!productUnit || standardUnits.includes(productUnit) || existingUnitNames.includes(productUnit)) {
      return "";
    }
    return productUnit;
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name || initialName || "",
      stocks: product?.stocks ?? 0,
      unit: getDefaultUnit(product?.unit),
      customUnit: getDefaultCustomUnit(product?.unit),
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

      const payload = {
        ...values,
        unit: values.unit === "Other" ? values.customUnit : values.unit,
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
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
                <FormLabel>Product Name</FormLabel>
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
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <Popover open={unitOpen} onOpenChange={setUnitOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={unitOpen}
                        className="w-full justify-between"
                      >
                        {field.value
                          ? field.value === "Other"
                            ? "Other (Custom)"
                            : field.value
                          : "Select unit..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search units..." />
                      <CommandList>
                        <CommandEmpty>No unit found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="Piece"
                            onSelect={() => {
                              form.setValue("unit", "Piece");
                              setUnitOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === "Piece" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Piece
                          </CommandItem>
                          <CommandItem
                            value="Kg"
                            onSelect={() => {
                              form.setValue("unit", "Kg");
                              setUnitOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === "Kg" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Kg
                          </CommandItem>
                          <CommandItem
                            value="Litre"
                            onSelect={() => {
                              form.setValue("unit", "Litre");
                              setUnitOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === "Litre" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Litre
                          </CommandItem>
                          <CommandItem
                            value="Box"
                            onSelect={() => {
                              form.setValue("unit", "Box");
                              setUnitOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === "Box" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Box
                          </CommandItem>
                          <CommandItem
                            value="Meter"
                            onSelect={() => {
                              form.setValue("unit", "Meter");
                              setUnitOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === "Meter" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Meter
                          </CommandItem>
                          <CommandItem
                            value="Dozen"
                            onSelect={() => {
                              form.setValue("unit", "Dozen");
                              setUnitOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === "Dozen" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Dozen
                          </CommandItem>
                          <CommandItem
                            value="Pack"
                            onSelect={() => {
                              form.setValue("unit", "Pack");
                              setUnitOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === "Pack" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Pack
                          </CommandItem>
                          {existingUnits.map((unit) => (
                            <CommandItem
                              key={unit._id}
                              value={unit.name}
                              onSelect={() => {
                                form.setValue("unit", unit.name);
                                setUnitOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === unit.name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="flex-1">{unit.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteUnit(unit._id);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </CommandItem>
                          ))}
                          <CommandItem
                            value="Other"
                            onSelect={() => {
                              form.setValue("unit", "Other");
                              setUnitOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === "Other" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Other
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.watch("unit") === "Other" && (
            <FormField
              control={form.control}
              name="customUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Unit</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter custom unit" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
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
