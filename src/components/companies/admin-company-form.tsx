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
  ChevronLeft,
  ChevronRight,
  Loader2,
  PlusCircle,
  Save,
} from "lucide-react";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import type { Company, Client } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface AdminCompanyFormProps {
  company?: Company;
  clients: Client[];
  onFormSubmit: () => void;
}

const formSchema = z.object({
  registrationNumber: z.string().min(1),
  businessName: z.string().min(2),
  businessType: z.string().min(2),
  address: z.string().min(5),
  City: z.string().optional(),
  addressState: z.string().optional(),
  Country: z.string().optional(),
  Pincode: z.string().optional(),
  Telephone: z.string().optional(),
  mobileNumber: z
    .string({ required_error: "Mobile number is required" })
    .trim()
    .min(10, "Enter a valid 10-digit mobile number")
    .max(10, "Enter a valid 10-digit mobile number"),

  emailId: z.string().optional(),
  Website: z.string().optional(),
  PANNumber: z.string().optional(),
  IncomeTaxLoginPassword: z.string().optional(),
  gstin: z.string().optional(),
  gstState: z.string().optional(),
  RegistrationType: z.string().optional(),
  PeriodicityofGSTReturns: z.string().optional(),
  GSTUsername: z.string().optional(),
  GSTPassword: z.string().optional(),
  ewayBillApplicable: z.enum(["true", "false"]),
  EWBBillUsername: z.string().optional(),
  EWBBillPassword: z.string().optional(),
  TANNumber: z.string().optional(),
  TAXDeductionCollectionAcc: z.string().optional(),
  DeductorType: z.string().optional(),
  TDSLoginUsername: z.string().optional(),
  TDSLoginPassword: z.string().optional(),
  client: z.string().min(1),
});

type FormData = z.infer<typeof formSchema>;

const defaultBusinessTypes = [
  "Sole Proprietorship",
  "Partnership",
  "Private Limited Company",
  "Limited Company",
  "Others",
];

// Pretty labels for fields
const FIELD_LABELS: Partial<Record<keyof FormData | string, string>> = {
  client: "Assign to Client",
  businessType: "Business Type",
  businessName: "Business Name",
  registrationNumber: "Registration Number",
  address: "Address",
  City: "City",
  addressState: "Address State",
  Country: "Country",
  Pincode: "Pincode",
  Telephone: "Telephone",
  mobileNumber: "Mobile Number",
  emailId: "Email ID",
  Website: "Website",
  PANNumber: "PAN Number",
  IncomeTaxLoginPassword: "Income Tax Login Password",
  gstin: "GSTIN",
  gstState: "GST State",
  RegistrationType: "Registration Type",
  PeriodicityofGSTReturns: "Periodicity of GST Returns",
  GSTUsername: "GST Username",
  GSTPassword: "GST Password",
  ewayBillApplicable: "E-Way Bill Applicable",
  EWBBillUsername: "EWB Username",
  EWBBillPassword: "EWB Password",
  TANNumber: "TAN Number",
  TAXDeductionCollectionAcc: "Tax Deduction/Collection A/c",
  DeductorType: "Deductor Type",
  TDSLoginUsername: "TDS Login Username",
  TDSLoginPassword: "TDS Login Password",
};

// fallback: camelCase/PascalCase/underscores → Title Case
const titleize = (s: string) =>
  s
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

// single helper
const getLabel = (name: keyof FormData | string) =>
  FIELD_LABELS[name] ?? titleize(String(name));

export function AdminCompanyForm({
  company,
  clients,
  onFormSubmit,
}: AdminCompanyFormProps) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [step, setStep] = React.useState(1);

  const getClientId = (client: string | Client | undefined) => {
    if (!client) return "";
    if (typeof client === "string") return client;
    return client._id;
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      registrationNumber: company?.registrationNumber || "",
      businessName: company?.businessName || "",
      businessType: company?.businessType || "",
      address: company?.address || "",
      City: company?.City || "",
      addressState: company?.addressState || "",
      Country: company?.Country || "",
      Pincode: company?.Pincode || "",
      Telephone: company?.Telephone || "",
      mobileNumber: company?.mobileNumber || "",
      emailId: company?.emailId || "",
      Website: company?.Website || "",
      PANNumber: company?.PANNumber || "",
      IncomeTaxLoginPassword: company?.IncomeTaxLoginPassword || "",
      gstin: company?.gstin || "",
      gstState: company?.gstState || "",
      RegistrationType: company?.RegistrationType || "",
      PeriodicityofGSTReturns: company?.PeriodicityofGSTReturns || "",
      GSTUsername: company?.GSTUsername || "",
      GSTPassword: company?.GSTPassword || "",
      ewayBillApplicable:
        company?.ewayBillApplicable === true
          ? "true"
          : company?.ewayBillApplicable === false
          ? "false"
          : "false",

      EWBBillUsername: company?.EWBBillUsername || "",
      EWBBillPassword: company?.EWBBillPassword || "",
      TANNumber: company?.TANNumber || "",
      TAXDeductionCollectionAcc: company?.TAXDeductionCollectionAcc || "",
      DeductorType: company?.DeductorType || "",
      TDSLoginUsername: company?.TDSLoginUsername || "",
      TDSLoginPassword: company?.TDSLoginPassword || "",
      client: getClientId(company?.client),
    },
  });

  async function onSubmit(values: FormData) {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const url = company
        ? `${baseURL}/api/companies/${company._id}`
        : `${baseURL}/api/companies`;
      const method = company ? "PUT" : "POST";
      const { client, ...rest } = values;
      const submissionBody = { ...rest, selectedClient: client };
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submissionBody),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Operation failed.");
      toast({
        title: company ? "Company Updated!" : "Company Created!",
        description: `${values.businessName} has been successfully saved.`,
      });
      onFormSubmit();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Operation Failed",
        description:
          error instanceof Error ? error.message : "An error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 overflow-y-auto max-h-[80vh]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 ">
         
          <div className="flex justify-center items-center gap-2 pb-8">
            {[
              { number: 1, label: "Company Basic Details" },
              { number: 2, label: "GST Registration Details" },
              { number: 3, label: "Company TDS Details" },
            ].map(({ number, label }, index, array) => (
              <div key={number} className="flex items-center">
                <button
                  type="button"
                  onClick={() => setStep(number)}
                  className={`flex flex-col items-center group transition-all duration-200`}
                >
                  <div
                    className={`w-8 h-8 text-sm flex items-center justify-center rounded-full border-2 font-semibold mb-2 transition-all ${
                      step === number
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                        : "bg-white text-gray-500 border-gray-300 group-hover:border-indigo-400"
                    }`}
                  >
                    {number}
                  </div>
                  <span
                    className={`text-sm ${
                      step === number
                        ? "text-indigo-600 font-semibold"
                        : "text-gray-300 group-hover:text-gray-500"
                    }`}
                  >
                    {label}
                  </span>
                  {step === number && (
                    <div className="w-4 h-1 bg-indigo-600 rounded-full mt-1"></div>
                  )}
                </button>

                {/* Add arrow between steps except after the last one */}
                {index < array.length - 1 && (
                  <svg
                    className="mx-2 text-gray-300"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 18L15 12L9 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            ))}
          </div>

         <div className="pb-[15vh]">
           {step === 1 && (
            <>
              <FormField
                control={form.control}
                name="client"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Client</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client._id} value={client._id}>
                            {client.contactName} - ({client.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select business type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {defaultBusinessTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {[
                  "businessName",
                  "registrationNumber",
                  "address",
                  "City",
                  "addressState",
                  "Country",
                  "Pincode",
                  "Telephone",
                  "mobileNumber",
                  "emailId",
                  "Website",
                  "PANNumber",
                  "IncomeTaxLoginPassword",
                ].map((name) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name as keyof FormData}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{getLabel(name)}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "gstin",
                  "gstState",
                  "RegistrationType",
                  "PeriodicityofGSTReturns",
                  "GSTUsername",
                  "GSTPassword",
                  "EWBBillUsername",
                  "EWBBillPassword",
                ].map((name) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name as keyof FormData}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{getLabel(name)}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <FormField
                  control={form.control}
                  name="ewayBillApplicable"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{getLabel("ewayBillApplicable")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Yes or No" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "TANNumber",
                  "TAXDeductionCollectionAcc",
                  "DeductorType",
                  "TDSLoginUsername",
                  "TDSLoginPassword",
                ].map((name) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name as keyof FormData}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{getLabel(name)}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </>
          )}
         </div>

          <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4 z-50">
            <div className="container flex justify-between items-center">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="gap-1 transition-all hover:gap-2 min-w-[7rem]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
              )}
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="gap-1 transition-all hover:gap-2 min-w-[7rem] ml-auto"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 transition-colors min-w-[10rem]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {company ? "Saving..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      {company ? (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      ) : (
                        <>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create Company
                        </>
                      )}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
