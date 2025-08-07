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
import { Loader2, PlusCircle, X } from "lucide-react";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import type { Company } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface CompanyFormProps {
  company?: Company;
  onFormSubmit: () => void;
}

const formSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters."),
  registrationNumber: z.string().min(1, "Registration number is required."),
  address: z.string().min(5, "Address must be at least 5 characters."),
  companyOwner: z.string().min(2, "Owner name is required."),
  contactNumber: z.string().min(10, "A valid contact number is required."),
  gstin: z
    .string()
    .length(15, "GSTIN must be 15 characters long.")
    .optional()
    .or(z.literal("")),
  companyType: z.string().min(2, "Company type is required."),
});

type FormData = z.infer<typeof formSchema>;

const defaultCompanyTypes = ["Services", "Manufacturing", "Trading"];

export function CompanyForm({ company, onFormSubmit }: CompanyFormProps) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [companyTypes, setCompanyTypes] =
    React.useState<string[]>(defaultCompanyTypes);
  const [isAddingNewType, setIsAddingNewType] = React.useState(false);
  const [newCompanyType, setNewCompanyType] = React.useState("");

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
    },
  });

  React.useEffect(() => {
    if (company?.companyType && !companyTypes.includes(company.companyType)) {
      setCompanyTypes((prev) => [...prev, company.companyType]);
    }
  }, [company, companyTypes]);

  async function onSubmit(values: FormData) {
    setIsSubmitting(true);

    let submissionValues = { ...values };

    if (isAddingNewType && newCompanyType) {
      submissionValues.companyType = newCompanyType;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const url = company
        ? `${baseURL}/api/companies/${company._id}`
        : `${baseURL}/api/companies`;

      const method = company ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submissionValues),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.message || `Failed to ${company ? "update" : "create"} company.`
        );
      }

      toast({
        title: company ? "Company Updated!" : "Company Added!",
        description: `${submissionValues.companyName} has been successfully saved.`,
      });

      if (
        isAddingNewType &&
        newCompanyType &&
        !companyTypes.includes(newCompanyType)
      ) {
        setCompanyTypes((prev) => [...prev, newCompanyType]);
      }
      setIsAddingNewType(false);
      setNewCompanyType("");
      onFormSubmit();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Operation Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleAddNewType = () => {
    form.setValue("companyType", ""); // Clear validation error
    setIsAddingNewType(true);
  };

  const handleCancelNewType = () => {
    setIsAddingNewType(false);
    setNewCompanyType("");
    const defaultType = company?.companyType || companyTypes[0];
    if (defaultType) {
      form.setValue("companyType", defaultType, { shouldValidate: true });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          if (isAddingNewType && newCompanyType.trim()) {
            values.companyType = newCompanyType.trim();
          }
          onSubmit(values);
        })}
        className="space-y-4 pt-4"
      >
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
                <Input
                  placeholder="e.g. 123 Business Bay, Suite 101"
                  {...field}
                />
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
                <div className="flex items-center justify-between">
                  <FormLabel>Company Type</FormLabel>
                  {!isAddingNewType ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleAddNewType}
                      className="flex items-center gap-1 -mr-2"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add New
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelNewType}
                      className="flex items-center gap-1 -mr-2 text-destructive"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                </div>
                {isAddingNewType ? (
                  <FormControl>
                    <Input
                      placeholder="e.g. Technology"
                      value={newCompanyType}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewCompanyType(value);
                        form.setValue("companyType", value, {
                          shouldValidate: true,
                        });
                      }}
                    />
                  </FormControl>
                ) : (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a company type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {companyTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {company ? "Save Changes" : "Add Company"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
