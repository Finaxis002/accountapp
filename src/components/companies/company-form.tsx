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
import type { Company, Client } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Country, State, City } from "country-state-city";
import { Combobox } from "@/components/ui/combobox"; // your searchable combobox

interface CompanyFormProps {
  company?: Company;
  onFormSubmit: () => void;
}

const formSchema = z.object({
  registrationNumber: z.string().min(1, "Registration number is required."),
  businessName: z.string().min(1, "Business name is required."),
  businessType: z.string().min(1, "Business type is required."),
  address: z.string().min(1, "Address is required."),
  City: z.string().optional(),
  addressState: z.string().optional(),
  Country: z.string().optional(),
  Pincode: z.string().optional(),
  Telephone: z.string().optional(),
  mobileNumber: z.string().optional(),
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
  ewayBillApplicable: z.enum(["true", "false"]).default("false"),
  EWBBillUsername: z.string().optional(),
  EWBBillPassword: z.string().optional(),
  TANNumber: z.string().optional(),
  TAXDeductionCollectionAcc: z.string().optional(),
  DeductorType: z.string().optional(),
  TDSLoginUsername: z.string().optional(),
  TDSLoginPassword: z.string().optional(),
  client: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const defaultbusinessTypes = ["Services", "Manufacturing", "Trading"];

export function CompanyForm({ company, onFormSubmit }: CompanyFormProps) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [businessTypes, setbusinessTypes] =
    React.useState<string[]>(defaultbusinessTypes);
  const [isAddingNewType, setIsAddingNewType] = React.useState(false);
  const [newbusinessType, setNewbusinessType] = React.useState("");
  const india = Country.getCountryByCode("IN")!;
  const [countryCode, setCountryCode] = React.useState<string>("IN"); // default India
  const [stateCode, setStateCode] = React.useState<string>(""); // ISO code for state
  const [stateOptions, setStateOptions] = React.useState<
    { label: string; value: string }[]
  >([]);
  const [cityOptions, setCityOptions] = React.useState<
    { label: string; value: string }[]
  >([]);

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

  React.useEffect(() => {
    if (
      company?.businessType &&
      !businessTypes.includes(company.businessType)
    ) {
      setbusinessTypes((prev) => [...prev, company.businessType]);
    }
  }, [company, businessTypes]);

  async function onSubmit(values: FormData) {
    setIsSubmitting(true);

    let submissionValues = { ...values };

    if (isAddingNewType && newbusinessType) {
      submissionValues.businessType = newbusinessType;
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
        description: `${submissionValues.businessName} has been successfully saved.`,
      });

      if (
        isAddingNewType &&
        newbusinessType &&
        !businessTypes.includes(newbusinessType)
      ) {
        setbusinessTypes((prev) => [...prev, newbusinessType]);
      }
      setIsAddingNewType(false);
      setNewbusinessType("");
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
    form.setValue("businessType", ""); // Clear validation error
    setIsAddingNewType(true);
  };

  const handleCancelNewType = () => {
    setIsAddingNewType(false);
    setNewbusinessType("");
    const defaultType = company?.businessType || businessTypes[0];
    if (defaultType) {
      form.setValue("businessType", defaultType, { shouldValidate: true });
    }
  };

  React.useEffect(() => {
    const states = State.getStatesOfCountry(countryCode) || [];
    setStateOptions(states.map((s) => ({ label: s.name, value: s.isoCode })));
  }, [countryCode]);

  // build city list when state (iso) changes
  React.useEffect(() => {
    if (!countryCode || !stateCode) {
      setCityOptions([]);
      return;
    }
    const cities = City.getCitiesOfState(countryCode, stateCode) || [];
    setCityOptions(cities.map((c) => ({ label: c.name, value: c.name }))); // store city name as value
  }, [countryCode, stateCode]);

  // On first load, sync existing values (edit mode)
  React.useEffect(() => {
    // default country to India in the form if empty
    if (!form.getValues("Country")) {
      form.setValue("Country", india.name, { shouldValidate: true });
    }

    // if an existing state name is present, find its iso and set stateCode
    const existingStateName = (form.getValues("addressState") || "").toString();
    if (existingStateName) {
      const iso = State.getStatesOfCountry("IN").find(
        (s) => s.name.toLowerCase() === existingStateName.toLowerCase()
      )?.isoCode;
      if (iso) setStateCode(iso);
    }
  }, []); // run once

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          if (isAddingNewType && newbusinessType.trim()) {
            values.businessType = newbusinessType.trim();
          }
          onSubmit(values);
        })}
        className="space-y-4 pt-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="businessName"
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* COUNTRY */}
          <FormField
            control={form.control}
            name="Country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <Combobox
                  options={[{ label: india.name, value: india.isoCode }]}
                  value={countryCode}
                  onChange={(iso) => {
                    setCountryCode(iso);
                    setStateCode("");
                    setCityOptions([]);
                    field.onChange(Country.getCountryByCode(iso)?.name || "");
                    form.setValue("addressState", "");
                    form.setValue("City", "");
                  }}
                  placeholder="Select country"
                  searchPlaceholder="Type to search"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* STATE */}
          <FormField
            control={form.control}
            name="addressState"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <Combobox
                  options={stateOptions}
                  value={
                    stateCode ||
                    stateOptions.find(
                      (o) =>
                        o.label.toLowerCase() ===
                        (field.value || "").toLowerCase()
                    )?.value ||
                    ""
                  }
                  onChange={(iso) => {
                    setStateCode(iso);
                    const selected = State.getStatesOfCountry(countryCode).find(
                      (s) => s.isoCode === iso
                    );
                    field.onChange(selected?.name || "");
                    form.setValue("City", "");
                  }}
                  placeholder="Select state"
                  searchPlaceholder="Type state name"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* CITY */}
          <FormField
            control={form.control}
            name="City"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <Combobox
                  options={cityOptions}
                  value={
                    cityOptions.find(
                      (o) =>
                        o.label.toLowerCase() ===
                        (field.value || "").toLowerCase()
                    )?.value || ""
                  }
                  onChange={(v) => field.onChange(v)}
                  placeholder={
                    stateCode ? "Select city" : "Select a state first"
                  }
                  searchPlaceholder="Type city name"
                  disabled={!stateCode || cityOptions.length === 0}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="mobileNumber"
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
            name="businessType"
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
                      value={newbusinessType}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewbusinessType(value);
                        form.setValue("businessType", value, {
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
                      {businessTypes.map((type) => (
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
