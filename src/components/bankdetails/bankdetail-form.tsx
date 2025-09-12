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
import { ScrollArea } from "../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

// Update interfaces to handle both string and object company types
interface Company {
  _id: string;
  businessName: string;
}

interface BankDetail {
  _id: string;
  client: string;
  company: string | Company;  // Can be string ID or Company object
  bankName: string;
  managerName: string;
  contactNumber: string;
  email?: string;
  city: string;
  ifscCode?: string;
  branchAddress?: string;
}

interface BankDetailsFormProps {
  bankDetail?: BankDetail;
  onSuccess: () => void;
  onCancel?: () => void;
}

// Form validation schema
const formSchema = z.object({
  company: z.string().min(1, "Company is required."),
  bankName: z.string().min(2, "Bank name is required."),
  managerName: z.string().min(2, "Manager name is required."),
  contactNumber: z
    .string()
    .min(10, "Valid 10-digit contact number required.")
    .max(10, "Valid 10-digit contact number required."),
  email: z
    .string()
    .email("Invalid email address.")
    .optional()
    .or(z.literal("")),
  city: z.string().min(2, "City is required."),
  ifscCode: z
    .string()
    .min(11, "IFSC code must be 11 characters.")
    .max(11, "IFSC code must be 11 characters.")
    .optional()
    .or(z.literal("")),
  branchAddress: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

export function BankDetailsForm({
  bankDetail,
  onSuccess,
  onCancel,
}: BankDetailsFormProps) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Helper function to extract company ID
  const getCompanyId = (company: string | Company | undefined): string => {
    if (!company) return "";
    if (typeof company === "string") return company;
    return company._id;
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company: getCompanyId(bankDetail?.company),
      bankName: bankDetail?.bankName || "",
      managerName: bankDetail?.managerName || "",
      contactNumber: bankDetail?.contactNumber || "",
      email: bankDetail?.email || "",
      city: bankDetail?.city || "",
      ifscCode: bankDetail?.ifscCode || "",
      branchAddress: bankDetail?.branchAddress || "",
    },
  });

  // Fetch companies from the backend
  const fetchCompanies = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const response = await fetch(`${baseURL}/api/companies/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch companies.");
      }

      const companiesData = await response.json();
      setCompanies(companiesData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load companies",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [baseURL, toast]);

  React.useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Update form values when bankDetail changes
  React.useEffect(() => {
    if (bankDetail) {
      form.reset({
        company: getCompanyId(bankDetail.company),
        bankName: bankDetail.bankName,
        managerName: bankDetail.managerName,
        contactNumber: bankDetail.contactNumber,
        email: bankDetail.email || "",
        city: bankDetail.city,
        ifscCode: bankDetail.ifscCode || "",
        branchAddress: bankDetail.branchAddress || "",
      });
    }
  }, [bankDetail, form]);

  // Function to decode JWT token and extract client ID
  const getClientIdFromToken = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      
      // Decode the token without verification (for client-side use only)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.clientId || payload.id || null;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  async function onSubmit(values: FormData) {
    setIsSubmitting(true);
    try {
      // Get the authentication token from localStorage
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      // Decode the token and extract the clientId
      const clientId = getClientIdFromToken();
      if (!clientId) {
        throw new Error("Client authentication required. Please log in again.");
      }

      // Include clientId in the form data
      const formData = { ...values, client: clientId };

      // Determine if we're creating a new or updating an existing bank detail
      const url = bankDetail
        ? `${baseURL}/api/bank-details/${bankDetail._id}` // URL for updating
        : `${baseURL}/api/bank-details`; // URL for creating

      const method = bankDetail ? "PUT" : "POST"; // Method based on if we're creating or updating

      // Make the fetch request to the backend API
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData), // Send form data in the body
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(
          data.message || `Failed to ${bankDetail ? "update" : "create"} bank detail.`
        );
      }

      // Success toast
      toast({
        title: "Success",
        description: `Bank detail ${bankDetail ? "updated" : "created"} successfully.`,
      });

      // Trigger the success callback to close or refresh the form
      onSuccess();
    } catch (error) {
      // Error toast
      toast({
        variant: "destructive",
        title: "Operation Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsSubmitting(false); // Reset the submitting state
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="contents">
        <ScrollArea className="max-h-[60vh] flex-1">
          <div className="space-y-4 px-6 pb-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Company Dropdown */}
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company._id} value={company._id}>
                            {company.businessName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. State Bank of India"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="managerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manager Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. John Doe" {...field} />
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
                      <Input
                        placeholder="e.g. 9876543210"
                        {...field}
                        type="tel"
                        maxLength={10}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. john@example.com" 
                        {...field} 
                        type="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branchAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. 123 Main St, New York"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. New York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ifscCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IFSC Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. SBIN0123456" 
                        {...field} 
                        style={{ textTransform: 'uppercase' }}
                        maxLength={11}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-3 p-6 border-t bg-background">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {bankDetail ? "Save Changes" : "Create Bank Detail"}
          </Button>
        </div>
      </form>
    </Form>
  );
}