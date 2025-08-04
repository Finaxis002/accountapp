// "use client";

// import { zodResolver } from "@hookform/resolvers/zod";
// import { useForm } from "react-hook-form";
// import { z } from "zod";
// import { Button } from "@/components/ui/button";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Loader2 } from "lucide-react";
// import React from "react";
// import { useToast } from "@/hooks/use-toast";
// import type { Company, Client } from "@/lib/types";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../ui/select";

// interface AdminCompanyFormProps {
//   company?: Company;
//   clients: Client[];
//   onFormSubmit: () => void;
// }

// // const formSchema = z.object({
// //   registrationNumber: z.string().min(1, "Registration number is required."),
// //   businessName: z
// //     .string()
// //     .min(2, "Company name must be at least 2 characters."),
// //   businessType: z.string().min(2, "Company type is required."),
// //   address: z.string().min(5, "Address must be at least 5 characters."),
// //   City: z.string().optional(),
// //   addressState: z.string().optional(),
// //   Country: z.string().optional(),
// //   Pincode: z.string().optional(),
// //   Telephone: z.string().optional(),
// //   mobileNumber: z.string().optional(),
// //   emailId: z.string().optional(),
// //   Website: z.string().optional(),
// //   PANNumber: z.string().optional(),
// //   IncomeTaxLoginPassword: z.string().optional(),
// //   gstin: z.string().optional(),
// //   gstState: z.string().optional(),
// //   RegistrationType: z.string().optional(),
// //   PeriodicityofGSTReturns: z.string().optional(),
// //   GSTUsername: z.string().optional(),
// //   GSTPassword: z.string().optional(),
// //   ewayBillApplicable: z.enum(["Yes", "No"]),
// //   EWBBillUsername: z.string().optional(),
// //   EWBBillPassword: z.string().optional(),
// //   TANNumber: z.string().optional(),
// //   TAXDeductionCollectionAcc: z.string().optional(),
// //   DeductorType: z.string().optional(),
// //   TDSLoginUsername: z.string().optional(),
// //   TDSLoginPassword: z.string().optional(),

// //   client: z.string().min(1, "You must select a client."),
// // });

// const formSchema = z.object({
//   registrationNumber: z.string().min(1),
//   businessName: z.string().min(2),
//   businessType: z.string().min(2),
//   address: z.string().min(5),
//   City: z.string().optional(),
//   addressState: z.string().optional(),
//   Country: z.string().optional(),
//   Pincode: z.string().optional(),
//   Telephone: z.string().optional(),
//   mobileNumber: z.string().optional(),
//   emailId: z.string().optional(),
//   Website: z.string().optional(),
//   PANNumber: z.string().optional(),
//   IncomeTaxLoginPassword: z.string().optional(),
//   gstin: z.string().optional(),
//   gstState: z.string().optional(),
//   RegistrationType: z.string().optional(),
//   PeriodicityofGSTReturns: z.string().optional(),
//   GSTUsername: z.string().optional(),
//   GSTPassword: z.string().optional(),
//   ewayBillApplicable: z.enum(["Yes", "No"]),
//   EWBBillUsername: z.string().optional(),
//   EWBBillPassword: z.string().optional(),
//   TANNumber: z.string().optional(),
//   TAXDeductionCollectionAcc: z.string().optional(),
//   DeductorType: z.string().optional(),
//   TDSLoginUsername: z.string().optional(),
//   TDSLoginPassword: z.string().optional(),
//   client: z.string().min(1),
// });

// type FormData = z.infer<typeof formSchema>;

// const defaultCompanyTypes = [
//   "Sole Proprietorship",
//   "Partnership",
//   "Private Limited Company",
//   "Limited Company",
//   "Others",
// ];

// export function AdminCompanyForm({
//   company,
//   clients,
//   onFormSubmit,
// }: AdminCompanyFormProps) {
//   const { toast } = useToast();
//   const [isSubmitting, setIsSubmitting] = React.useState(false);

//   const getClientId = (client: string | Client | undefined) => {
//     if (!client) return "";
//     if (typeof client === "string") return client;
//     return client._id;
//   };

// //   const form = useForm<FormData>({
// //     resolver: zodResolver(formSchema),
// //     defaultValues: {
// //       registrationNumber: company?.registrationNumber || "",
// //       businessName: company?.businessName || "",
// //       businessType: company?.businessType || "",
// //       address: company?.address || "",
// //       City: company?.City || "",
// //       addressState: company?.addressState || "",
// //       Country: company?.Country || "",
// //       Pincode: company?.Pincode || "",
// //       Telephone: company?.Telephone || "",
// //       mobileNumber: company?.mobileNumber || "",
// //       emailId: company?.emailId || "",
// //       Website: company?.Website || "",
// //       PANNumber: company?.PANNumber || "",
// //       IncomeTaxLoginPassword: company?.IncomeTaxLoginPassword || "",
// //       gstin: company?.gstin || "",
// //       gstState: company?.gstState || "",
// //       RegistrationType: company?.RegistrationType || "",
// //       PeriodicityofGSTReturns: company?.PeriodicityofGSTReturns || "",
// //       GSTUsername: company?.GSTUsername || "",
// //       GSTPassword: company?.GSTPassword || "",
// //       ewayBillApplicable: company?.ewayBillApplicable || "No",
// //       EWBBillUsername: company?.EWBBillUsername || "",
// //       EWBBillPassword: company?.EWBBillPassword || "",
// //       TANNumber: company?.TANNumber || "",
// //       TAXDeductionCollectionAcc: company?.TAXDeductionCollectionAcc || "",
// //       DeductorType: company?.DeductorType || "",
// //       TDSLoginUsername: company?.TDSLoginUsername || "",
// //       TDSLoginPassword: company?.TDSLoginPassword || "",

// //       client: getClientId(company?.client),
// //     },
// //   });

// const form = useForm<FormData>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       registrationNumber: company?.registrationNumber || "",
//       businessName: company?.businessName || "",
//       businessType: company?.businessType || "",
//       address: company?.address || "",
//       City: company?.City || "",
//       addressState: company?.addressState || "",
//       Country: company?.Country || "",
//       Pincode: company?.Pincode || "",
//       Telephone: company?.Telephone || "",
//       mobileNumber: company?.mobileNumber || "",
//       emailId: company?.emailId || "",
//       Website: company?.Website || "",
//       PANNumber: company?.PANNumber || "",
//       IncomeTaxLoginPassword: company?.IncomeTaxLoginPassword || "",
//       gstin: company?.gstin || "",
//       gstState: company?.gstState || "",
//       RegistrationType: company?.RegistrationType || "",
//       PeriodicityofGSTReturns: company?.PeriodicityofGSTReturns || "",
//       GSTUsername: company?.GSTUsername || "",
//       GSTPassword: company?.GSTPassword || "",
//       ewayBillApplicable: company?.ewayBillApplicable || "No",
//       EWBBillUsername: company?.EWBBillUsername || "",
//       EWBBillPassword: company?.EWBBillPassword || "",
//       TANNumber: company?.TANNumber || "",
//       TAXDeductionCollectionAcc: company?.TAXDeductionCollectionAcc || "",
//       DeductorType: company?.DeductorType || "",
//       TDSLoginUsername: company?.TDSLoginUsername || "",
//       TDSLoginPassword: company?.TDSLoginPassword || "",
//       client: getClientId(company?.client),
//     },
//   });

//   async function onSubmit(values: FormData) {
//     setIsSubmitting(true);

//     try {
//       const token = localStorage.getItem("token");
//       if (!token) throw new Error("Authentication token not found.");

//       const url = company
//         ? `http://localhost:5000/api/companies/${company._id}`
//         : "http://localhost:5000/api/companies";

//       const method = company ? "PUT" : "POST";

//       const { client, ...restOfValues } = values;
//       const submissionBody = {
//         ...restOfValues,
//         selectedClient: client,
//       };

//       const res = await fetch(url, {
//         method,
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(submissionBody),
//       });

//       const data = await res.json();
//       if (!res.ok) {
//         throw new Error(
//           data.message || `Failed to ${company ? "update" : "create"} company.`
//         );
//       }

//       toast({
//         title: company ? "Company Updated!" : "Company Created!",
//         description: `${values.businessName} has been successfully saved.`,
//       });

//       onFormSubmit();
//     } catch (error) {
//       toast({
//         variant: "destructive",
//         title: "Operation Failed",
//         description:
//           error instanceof Error ? error.message : "An unknown error occurred.",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   }

//   const clientOptions = clients.map((client) => ({
//     value: client._id,
//     label: `${client.contactName} (${client.email})`,
//   }));

//   return (
//     <Form {...form}>
//       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
//         <FormField
//           control={form.control}
//           name="client"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Assign to Client</FormLabel>
//               <Select
//                 onValueChange={field.onChange}
//                 value={field.value}
//                 defaultValue={field.value}
//               >
//                 <FormControl>
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select a client to assign this company" />
//                   </SelectTrigger>
//                 </FormControl>
//                 <SelectContent>
//                   {clients.map((client) => (
//                     <SelectItem key={client._id} value={client._id}>
//                       {client.contactName} - ({client.email})
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <FormField
//             control={form.control}
//             name="businessName"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Business Name</FormLabel>
//                 <FormControl>
//                   <Input placeholder="e.g. Innovate Inc." {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="registrationNumber"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Registration Number</FormLabel>
//                 <FormControl>
//                   <Input placeholder="e.g. U74999DL2015PTC284390" {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//         </div>

//         <FormField
//           control={form.control}
//           name="address"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Address</FormLabel>
//               <FormControl>
//                 <Input
//                   placeholder="e.g. 123 Business Bay, Suite 101"
//                   {...field}
//                 />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <FormField
//             control={form.control}
//             name="City"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>City</FormLabel>
//                 <FormControl>
//                   <Input placeholder="e.g. Jane Doe" {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           <FormField
//             control={form.control}
//             name="addressState"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>State</FormLabel>
//                 <FormControl>
//                   <Input placeholder="e.g. Jane Doe" {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           <FormField
//             control={form.control}
//             name="Country"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Country</FormLabel>
//                 <FormControl>
//                   <Input placeholder="e.g. Jane Doe" {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           <FormField
//             control={form.control}
//             name="Pincode"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Pincode</FormLabel>
//                 <FormControl>
//                   <Input placeholder="e.g. Jane Doe" {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           <FormField
//             control={form.control}
//             name="mobileNumber"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Mobile Number</FormLabel>
//                 <FormControl>
//                   <Input placeholder="e.g. +1 555-555-5555" {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           <FormField
//             control={form.control}
//             name="Telephone"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Telephone</FormLabel>
//                 <FormControl>
//                   <Input placeholder="e.g. +1 555-555-5555" {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <FormField
//             control={form.control}
//             name="gstin"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>GSTIN (Optional)</FormLabel>
//                 <FormControl>
//                   <Input placeholder="e.g. 22AAAAA0000A1Z5" {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="businessType"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Company Type</FormLabel>
//                 <Select
//                   onValueChange={field.onChange}
//                   defaultValue={field.value}
//                 >
//                   <FormControl>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select a company type" />
//                     </SelectTrigger>
//                   </FormControl>
//                   <SelectContent>
//                     {defaultCompanyTypes.map((type) => (
//                       <SelectItem key={type} value={type}>
//                         {type}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//         </div>

//         <div className="flex justify-end pt-4">
//           <Button type="submit" disabled={isSubmitting}>
//             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//             {company ? "Save Changes" : "Create Company"}
//           </Button>
//         </div>
//       </form>
//     </Form>
//   );
// }

//////////////////////////////////////////////////////////////////////////////////////////////

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
  ewayBillApplicable: z.enum(["Yes", "No"]),
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

export function AdminCompanyForm({
  company,
  clients,
  onFormSubmit,
}: AdminCompanyFormProps) {
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
      ewayBillApplicable: company?.ewayBillApplicable || "No",
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
        ? `http://localhost:5000/api/companies/${company._id}`
        : "http://localhost:5000/api/companies";
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          {/* <div className="flex justify-center gap-4 pb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-semibold ${
                step === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-300"
              }`}
            >
              {s}
            </div>
          ))}
        </div> */}
          <div className="flex justify-center gap-6 pb-6">
            {[
              { number: 1, label: "Company Basic Details" },
              { number: 2, label: "GST Registration Details" },
              { number: 3, label: "Company TDS Details" },
            ].map(({ number, label }) => (
              <button
                key={number}
                type="button"
                onClick={() => setStep(number)}
                className={`flex flex-col items-center transition-all duration-200`}
              >
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-full border-2 font-semibold mb-1 ${
                    step === number
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-500 border-gray-300"
                  }`}
                >
                  {number}
                </div>
                <span
                  className={`text-xs ${
                    step === number
                      ? "text-blue-600 font-medium"
                      : "text-gray-500"
                  }`}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>

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
                        <FormLabel>{name}</FormLabel>
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
                        <FormLabel>{name}</FormLabel>
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
                      <FormLabel>E-Way Bill Applicable</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Yes / No" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
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
                        <FormLabel>{name}</FormLabel>
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

          <div className="flex justify-between pt-4">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
              >
                Previous
              </Button>
            )}
            {step < 3 ? (
              <Button type="button" onClick={() => setStep(step + 1)}>
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {company ? "Save Changes" : "Create Company"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
