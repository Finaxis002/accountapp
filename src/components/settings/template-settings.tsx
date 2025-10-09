// @/components/settings/template-settings.tsx
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Eye, Check, Laptop, Monitor } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { generatePdfForTemplate1 } from "@/lib/pdf-template1";
import { generatePdfForTemplate2 } from "@/lib/pdf-template2";
import { generatePdfForTemplate3 } from "@/lib/pdf-template3";
import { generatePdfForTemplate4 } from "@/lib/pdf-template4";
import { generatePdfForTemplate5 } from "@/lib/pdf-template5";
import { generatePdfForTemplate6 } from "@/lib/pdf-template6";
import { generatePdfForTemplate7 } from "@/lib/pdf-template7";
import { generatePdfForTemplate8 } from "@/lib/pdf-template8";
import { generatePdfForTemplate11 } from "@/lib/pdf-template11";
import { generatePdfForTemplate12 } from "@/lib/pdf-template12";
import { generatePdfForTemplate16 } from "@/lib/pdf-template16";
import { generatePdfForTemplate17 } from "@/lib/pdf-template17";
import { generatePdfForTemplate18 } from "@/lib/pdf-template18";
import { generatePdfForTemplate19 } from "@/lib/pdf-template19";
import { generatePdfForTemplateA5 } from "@/lib/pdf-templateA5";
import { generatePdfForTemplateA5_3 } from "@/lib/pdf-templateA5-3";
import { generatePdfForTemplateA5_4 } from "@/lib/pdf-templateA5-4";
import { generatePdfForTemplatet3 } from "@/lib/pdf-template-t3";
import jsPDF from "jspdf";
import type { Company, Party, Transaction } from "@/lib/types";

const templateOptions = [
  { value: "template1", label: "Template 1", color: "bg-blue-500" },
  { value: "template8", label: "Template 2", color: "bg-purple-500" },
  { value: "template11", label: "Template 3", color: "bg-gray-800" },
  { value: "template12", label: "Template 4", color: "bg-green-500" },
  { value: "template16", label: "Template 5", color: "bg-amber-600" },
  { value: "template17", label: "Template 6", color: "bg-indigo-600" },
  { value: "template19", label: "Template 7", color: "bg-teal-600" },
  { value: "templateA5", label: "Template A5", color: "bg-pink-500" },
  { value: "templateA5_3", label: "Template A5-3", color: "bg-orange-500" },
  { value: "templateA5_4", label: "Template A5-4", color: "bg-cyan-500" },
  { value: "template-t3", label: "Template T3", color: "bg-lime-500" },
  { value: "template18", label: "Template T3-2", color: "bg-rose-500" },
];

// Dummy data for preview
const dummyCompany: Company = {
  _id: "company1",
  registrationNumber: "REG123456",
  businessName: "Your Company Inc.",
  businessType: "Private Limited",
  address: "123 Business St",
  mobileNumber: "1234567890",
  gstin: "GSTIN123456789",
};

const dummyParty: Party = {
  _id: "party1",
  name: "Client Name",
  type: "party",
  createdByClient: "client1",
  email: "client@example.com",
  address: "123 Client Street",
  city: "Client City",
  state: "Client State",
  gstin: "GSTIN987654321",
};

const dummyTransaction: Transaction = {
  _id: "trans1",
  date: new Date(),
  dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
  invoiceNumber: "INV-2023-001",
  items: [
    {
      id: "1",
      name: "Web Development",
      quantity: 1,
      price: 1200,
      taxRate: 18,
    },
    {
      id: "2",
      name: "UI/UX Design",
      quantity: 1,
      price: 800,
      taxRate: 18,
    },
    {
      id: "3",
      name: "Consultation",
      quantity: 2,
      price: 100,
      taxRate: 18,
    },
  ],
  type: "sales" as const,
  amount: 2496,
  fromState: undefined,
  toState: undefined
};

const dummyServiceNames = new Map([
  ["service1", "Web Development"],
  ["service2", "UI/UX Design"],
  ["service3", "Consultation"],
]);

const dummyBank = {
  _id: "bank1",
  client: "client1",
  user: "user1",
  company: "company1",
  bankName: "Sample Bank",
  managerName: "John Manager",
  contactNumber: "9876543210",
  email: "manager@samplebank.com",
  city: "Mumbai",
  ifscCode: "SBIN0001234",
  branchAddress: "Main Branch, Mumbai",
  accountNumber: "1234567890",
  upiId: "sample@upi",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  __v: 0,
} as any;

const dummyClient = {
  _id: "client1",
  clientUsername: "johndoe",
  contactName: "John Doe",
  email: "john@example.com",
  phone: "9876543210",
  role: "admin",
  createdAt: new Date().toISOString(),
  companyName: "Sample Company",
  subscriptionPlan: "Premium" as const,
  status: "Active" as const,
  revenue: 100000,
  users: 5,
  companies: 2,
  totalSales: 50000,
  totalPurchases: 30000,
  maxCompanies: 5,
  maxUsers: 10,
  maxInventories: 1000,
  canSendInvoiceEmail: true,
  canSendInvoiceWhatsapp: true,
  canCreateUsers: true,
  canCreateProducts: true,
  canCreateCustomers: true,
  canCreateVendors: true,
  canCreateCompanies: true,
  canCreateInventory: true,
  canUpdateCompanies: true,
  slug: "sample-client",
} as any;

type TemplateKey =
  | "template1"
  | "template8"
  | "template11"
  | "template12"
  | "template16"
  | "template17"
  | "template19"
  | "templateA5"
  | "templateA5_3"
  | "templateA5_4"
  | "template-t3"
  | "template18";

export function TemplateSettings() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [selectedTemplate, setSelectedTemplate] =
    React.useState<TemplateKey>("template1");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = React.useState(true);
  const [fetchedTemplate, setFetchedTemplate] =
    React.useState<TemplateKey>("template1");
  const { toast } = useToast();

  // Fix the useEffect to properly set both states
  React.useEffect(() => {
    const loadTemplateSetting = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        console.log("Token :", token);
        const response = await fetch(
          `${baseURL}/api/settings/default-template`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const template = data.defaultTemplate || "template1";
          setSelectedTemplate(template as TemplateKey);
          setFetchedTemplate(template as TemplateKey);
        } else if (response.status === 404) {
          // If no template found, use default template1
          setSelectedTemplate("template1");
          setFetchedTemplate("template1");
        } else {
          throw new Error("Failed to fetch template");
        }
      } catch (error) {
        console.error("Failed to load template setting:", error);
        toast({
          title: "Error",
          description: "Failed to load template settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplateSetting();
  }, [toast, baseURL]);

  // Generate PDF preview when template changes
  React.useEffect(() => {
    let objectUrl: string | null = null;

    const generatePdfPreview = async () => {
      setIsGeneratingPreview(true);
      try {
        let pdfBlob: Blob;

        // Templates that use react-pdf (return Blob directly)
        if (
          selectedTemplate === "template1" ||
          selectedTemplate === "template8" ||
          selectedTemplate === "template12" ||
          selectedTemplate === "templateA5" ||
          selectedTemplate === "template18" ||
          selectedTemplate === "templateA5_3" ||
          selectedTemplate === "templateA5_4" ||
          selectedTemplate === "template-t3"
        ) {
          switch (selectedTemplate) {
            case "template1":
              pdfBlob = await generatePdfForTemplate1(
                dummyTransaction,
                dummyCompany,
                dummyParty,
                dummyServiceNames,
                null, // shippingAddress
                dummyBank
              );
              break;
            case "template8":
              pdfBlob = await generatePdfForTemplate8(
                dummyTransaction,
                dummyCompany,
                dummyParty,
                dummyServiceNames,
                null, // shippingAddress
                dummyBank
              );
              break;
            case "template12":
              pdfBlob = await generatePdfForTemplate12(
                dummyTransaction,
                dummyCompany,
                dummyParty,
                dummyServiceNames,
                null, // shippingAddress
                dummyBank
              );
              break;
            case "templateA5":
              pdfBlob = await generatePdfForTemplateA5(
                dummyTransaction,
                dummyCompany,
                dummyParty,
                dummyServiceNames,
                null, // shippingAddress
                dummyBank,
                dummyClient
              );
              break;
            case "template18":
              pdfBlob = await generatePdfForTemplate18(
                dummyTransaction,
                dummyCompany,
                dummyParty,
                dummyServiceNames,
                null, // shippingAddress
                dummyBank
              );
              break;
            case "templateA5_3":
              pdfBlob = await generatePdfForTemplateA5_3(
                dummyTransaction,
                dummyCompany,
                dummyParty,
                dummyServiceNames,
                null, // shippingAddress
                dummyBank,
                dummyClient
              );
              break;
            case "templateA5_4":
              pdfBlob = await generatePdfForTemplateA5_4(
                dummyTransaction,
                dummyCompany,
                dummyParty,
                dummyServiceNames,
                null, // shippingAddress
                dummyBank,
                dummyClient
              );
              break;
            case "template-t3":
              pdfBlob = await generatePdfForTemplatet3(
                dummyTransaction,
                dummyCompany,
                dummyParty,
                null, // shippingAddress
                dummyBank
              );
              break;
            default:
              pdfBlob = await generatePdfForTemplate1(
                dummyTransaction,
                dummyCompany,
                dummyParty,
                dummyServiceNames,
                null, // shippingAddress
                dummyBank
              );
          }
        } else {
          // Templates that use jsPDF
          let docPromise: Promise<jsPDF>;

          switch (selectedTemplate) {
            case "template11":
              docPromise = Promise.resolve(
                generatePdfForTemplate11(
                  dummyTransaction,
                  dummyCompany,
                  dummyParty,
                  dummyServiceNames,
                  null, // shippingAddress
                  undefined,
                  dummyBank
                )
              );
              break;
            case "template16":
              docPromise = Promise.resolve(
                generatePdfForTemplate16(
                  dummyTransaction,
                  dummyCompany,
                  dummyParty,
                  dummyServiceNames,
                  null // shippingAddress
                )
              );
              break;
            case "template17":
              docPromise = Promise.resolve(
                generatePdfForTemplate17(
                  dummyTransaction,
                  dummyCompany,
                  dummyParty,
                  dummyServiceNames,
                  null, // shippingAddress
                  dummyBank
                )
              );
              break;
            case "template19":
              docPromise = Promise.resolve(
                generatePdfForTemplate19(
                  dummyTransaction,
                  dummyCompany,
                  dummyParty,
                  dummyServiceNames,
                  null, // shippingAddress
                  dummyBank
                )
              );
              break;
            default:
              docPromise = generatePdfForTemplate3(
                dummyTransaction,
                dummyCompany,
                dummyParty,
                dummyServiceNames,
                null // shippingAddress
              );
          }

          const doc = await docPromise;
          pdfBlob = doc.output("blob");
        }

        objectUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(objectUrl);
      } catch (err) {
        console.error("Failed to generate preview:", err);
        setPdfUrl(null);
        toast({
          title: "Error",
          description: "Failed to generate template preview",
          variant: "destructive",
        });
      } finally {
        setIsGeneratingPreview(false);
      }
    };

    generatePdfPreview();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedTemplate, toast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${baseURL}/api/settings/default-template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ defaultTemplate: selectedTemplate }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Default template updated successfully",
        });
      } else {
        throw new Error("Failed to save template");
      }
    } catch (error) {
      console.error("Failed to save template:", error);
      toast({
        title: "Error",
        description: "Failed to save template setting",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getCurrentTemplate = () => {
    return (
      templateOptions.find((template) => template.value === selectedTemplate) ||
      templateOptions[0]
    );
  };

  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value as TemplateKey);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentTemplate = getCurrentTemplate();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Default Template</CardTitle>
          <CardDescription>
            Choose your preferred invoice template
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Display current template from DB */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Current Template:</span>
                <Badge variant="secondary" className="capitalize">
                  {templateOptions.find((t) => t.value === fetchedTemplate)
                    ?.label || "Not set"}
                </Badge>
              </div>
              <Check className="h-4 w-4 text-green-500" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template">Change Default Invoice Template</Label>
            <Select
              value={selectedTemplate}
              onValueChange={handleTemplateChange}
            >
              <SelectTrigger id="template" className="w-full">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templateOptions.map((template) => (
                  <SelectItem key={template.value} value={template.value}>
                    {template.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Update Template
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ✅ Desktop / Laptop Table */}
      <div className="hidden md:block">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Current Template Preview
            </CardTitle>
            <CardDescription>
              This is how your invoices will appear to clients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-md ${currentTemplate.color} flex items-center justify-center`}
                >
                  <span className="text-white font-bold text-xs">INV</span>
                </div>
                <div>
                  <h3 className="font-semibold">{currentTemplate.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    Selected as default
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                Active
              </Badge>
            </div>

            <div className="border rounded-lg overflow-hidden bg-secondary h-96">
              {isGeneratingPreview ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="ml-3">Generating Preview...</p>
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-0"
                  title="Template Preview"
                />
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p>Could not generate template preview.</p>
                </div>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              <p>
                This preview shows how your invoices will look with the{" "}
                <strong>{currentTemplate.label}</strong> template.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ✅ Mobile Card View */}
      <div className="md:hidden space-y-3">
        <Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Eye className="h-5 w-5" />
      Current Template Preview
    </CardTitle>
    <CardDescription>
      This is how your invoices will appear to clients
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-md ${currentTemplate.color} flex items-center justify-center`}
        >
          <span className="text-white font-bold text-xs">INV</span>
        </div>
        <div>
          <h3 className="font-semibold">{currentTemplate.label}</h3>
          <p className="text-sm text-muted-foreground">
            Selected as default
          </p>
        </div>
      </div>
      <Badge variant="outline" className="flex items-center gap-1">
        <Check className="h-3 w-3" />
        Active
      </Badge>
    </div>

    <div className="relative border rounded-lg overflow-hidden bg-secondary h-96">
      {/* Mobile Overlay */}
      <div className="md:hidden absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center p-4">
        <div className="text-center bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border max-w-sm">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
            <Monitor className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-lg mb-2">View on Desktop</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Please login on a desktop or laptop to view and customize your invoice template
          </p>
          <Button variant="default" size="sm">
            <Laptop className="h-4 w-4 mr-2" />
            Switch to Desktop
          </Button>
        </div>
      </div>

      {/* Blurred Content for Mobile */}
      <div className="md:hidden filter blur-md">
        {isGeneratingPreview ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-3">Generating Preview...</p>
          </div>
        ) : pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            title="Template Preview"
          />
        ) : (
          <div className="flex justify-center items-center h-full">
            <p>Could not generate template preview.</p>
          </div>
        )}
      </div>

      {/* Normal Content for Desktop */}
      <div className="hidden md:block">
        {isGeneratingPreview ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-3">Generating Preview...</p>
          </div>
        ) : pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            title="Template Preview"
          />
        ) : (
          <div className="flex justify-center items-center h-full">
            <p>Could not generate template preview.</p>
          </div>
        )}
      </div>
    </div>

    <div className="text-sm text-muted-foreground">
      <p>
        This preview shows how your invoices will look with the{" "}
        <strong>{currentTemplate.label}</strong> template.
      </p>
    </div>
  </CardContent>
</Card>
      </div>
    </div>
  );
}
