"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText, Loader2 } from "lucide-react";
import type { Company, Party, Transaction } from "@/lib/types";
import { DialogFooter } from "../ui/dialog";
// import {
//   generatePdfForTemplate1,
//   generatePdfForTemplate2,
//   generatePdfForTemplate3,
//   generatePdfForTemplate4,
//   generatePdfForTemplate5,
//   generatePdfForTemplate6,
//   generatePdfForTemplate7,
// } from "@/lib/pdf-templates";

import { generatePdfForTemplate2 } from "@/lib/pdf-template2";
import { generatePdfForTemplate3 } from "@/lib/pdf-template3";
import { generatePdfForTemplate4 } from "@/lib/pdf-template4";
import { generatePdfForTemplate5 } from "@/lib/pdf-template5";
import { generatePdfForTemplate6 } from "@/lib/pdf-template6";
import { generatePdfForTemplate7 } from "@/lib/pdf-template7";
// priya
import { generatePdfForTemplate1 } from "@/lib/pdf-template1";
import { generatePdfForTemplate8 } from "@/lib/pdf-template8";
import { generatePdfForTemplate11 } from "@/lib/pdf-template11";
import { generatePdfForTemplate12 } from "@/lib/pdf-template12";
import { generatePdfForTemplateA5 } from "@/lib/pdf-templateA5";
import { generatePdfForTemplateA5_3 } from "@/lib/pdf-templateA5-3";
import { generatePdfForTemplateA5_4 } from "@/lib/pdf-templateA5-4";
import { generatePdfForTemplatet3 } from "@/lib/pdf-template-t3";
import { generatePdfForTemplateA5_2 } from "@/lib/pdf-templateA3-2";
//amit
import { generatePdfForTemplate16 } from "@/lib/pdf-template16";
import { generatePdfForTemplate17 } from "@/lib/pdf-template17";
import { generatePdfForTemplate18 } from "@/lib/pdf-template18";
import { generatePdfForTemplate20 } from "@/lib/pdf-template20";
import { generatePdfForTemplate21 } from "@/lib/pdf-template21";
  import jsPDF from "jspdf";
import { EnhancedInvoicePreview } from "./enhanced-invoice-preview";
import { generatePdfForTemplate19 } from "@/lib/pdf-template19";

type TemplateKey =
  | "template1"
  | "template2"
  | "template3"
  | "template4"
  | "template5"
  | "template6"
  | "template7"
  | "template8"
  | "template11"
  | "template12"
  | "templateA5"
  | "templateA5_2"
  | "templateA5_3"
  | "templateA5_4"
  | "template-t3"
  | "template16"
  | "template17"
  | "template20"
  | "template21";
  | "template18"
  | "template19";

interface InvoicePreviewProps {
  transaction: Transaction | null;
  company: Company | null;
  party: Party | null;
  serviceNameById?: Map<string, string>;
  editMode?: boolean;
  onSave?: (updatedTransaction: Transaction) => void;
  onCancel?: () => void;
}

// 🐛 यहाँ 'shippingAddress' जोड़ा गया था।
type PdfGeneratorBaseArgs = [
  Transaction | null,
  Company | null,
  Party | null,
  Map<string, string> | undefined,
  any | null // shippingAddress
];

// ✅ CORRECTED: JsPdfGenerator type definition
type JsPdfGenerator = (...args: PdfGeneratorBaseArgs) => jsPDF | Promise<jsPDF>;

// ✅ CORRECTED: ReactPdfGenerator type definition (needs bank in addition to base args)
type ReactPdfGenerator = (...args: [...PdfGeneratorBaseArgs, any]) => Promise<Blob>;


export function InvoicePreview({
  transaction,
  company,
  party,
  serviceNameById,
  editMode = false,
  onSave,
  onCancel,
}: InvoicePreviewProps) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [selectedTemplate, setSelectedTemplate] =
    React.useState<TemplateKey>("template1");

  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [pdfBlob, setPdfBlob] = React.useState<Blob | null>(null);
  const [bank, setBank] = React.useState<any>(null);
  const [client, setClient] = React.useState<any>(null);

    // Fetch bank details
  React.useEffect(() => {
    console.log("transaction.bank:", transaction?.bank);
    if (transaction?.bank) {
      if (typeof transaction.bank === "object" && transaction.bank.bankName) {
        // Already populated Bank object
        console.log("bank already populated:", transaction.bank);
        setBank(transaction.bank);
      } else {
        // Need to fetch
        const bankId =
          typeof transaction.bank === "string"
            ? transaction.bank
            : (transaction.bank as any)?.$oid || (transaction.bank as any)?._id;
        console.log("bankId:", bankId);
        if (bankId) {
          fetch(`${baseURL}/api/bank-details/${bankId}`)
            .then((res) => res.json())
            .then((data) => {
              console.log("fetched bank:", data);
              setBank(data);
            })
            .catch((err) => console.error("Failed to fetch bank:", err));
        }
      }
    } else {
      setBank(null);
    }
  }, [transaction?.bank]);

  console.log("bank details:", bank);

  // Fetch client details
  React.useEffect(() => {
    console.log("company?.client:", company?.client);
    if (company?.client) {
      if (typeof company.client === "object" && company.client.contactName) {
        // Already populated Client object
        console.log("client already populated:", company.client);
        setClient(company.client);
      } else {
        // Need to fetch
        const clientId =
          typeof company.client === "string"
            ? company.client
            : (company.client as any)?.$oid || (company.client as any)?._id;
        console.log("clientId:", clientId);
        if (clientId) {
          fetch(`${baseURL}/api/clients/${clientId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          })
            .then((res) => res.json())
            .then((data) => {
              console.log("fetched client:", data);
              setClient(data);
            })
            .catch((err) => console.error("Failed to fetch client:", err));
        }
      }
    } else {
      setClient(null);
    }
  }, [company?.client]);

  React.useEffect(() => {
    let objectUrl: string | null = null;

    const generatePdf = async () => {
      if (!transaction) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      let pdfBlob: Blob | null = null; 

      try {
        const shippingAddress = transaction?.shippingAddress && typeof transaction.shippingAddress === 'object'
          ? transaction.shippingAddress as any
          : null;
        
        // Base arguments array for all generators
        const baseArgs: PdfGeneratorBaseArgs = [
            transaction,
            company,
            party,
            serviceNameById,
            shippingAddress
        ];

        // Use a single switch to handle all templates cleanly
        switch (selectedTemplate) {
          // --- REACT-PDF TEMPLATES (Return Blob directly, need bank) ---
          case "template8":
          case "template20":
          case "template21": {
            // Map the template key to the correct generator function
            const generator: ReactPdfGenerator = {
              "template8": generatePdfForTemplate8,
              "template20": generatePdfForTemplate20,
              "template21": generatePdfForTemplate21,
            }[selectedTemplate] as ReactPdfGenerator;

            pdfBlob = await generator(
                ...baseArgs,
                bank // Additional argument for React-PDF templates
            );
            break;
          }

          // --- JSPDF TEMPLATES (Return jsPDF document) ---
          case "template1":
          case "template2":
          case "template3":
          case "template4":
          case "template5":
          case "template6":
          case "template7":
          case "template16":
          case "template17":
          default: {
            // Map the template key to the correct generator function
            const generator: JsPdfGenerator = ({
                "template1": generatePdfForTemplate1,
                "template2": generatePdfForTemplate2,
                "template3": generatePdfForTemplate3,
                "template4": generatePdfForTemplate4,
                "template5": generatePdfForTemplate5,
                "template6": generatePdfForTemplate6,
                "template7": generatePdfForTemplate7,
                "template16": generatePdfForTemplate16,
                "template17": generatePdfForTemplate17,
            }[selectedTemplate] as JsPdfGenerator) || generatePdfForTemplate3; 
            
            // Execute the generator using spread syntax
            const doc = await Promise.resolve(generator(...baseArgs));
            
            pdfBlob = doc.output("blob");
            break;
          }
        }

        if (pdfBlob) {
          objectUrl = URL.createObjectURL(pdfBlob);
          setPdfUrl(objectUrl);
          setPdfBlob(pdfBlob);
        } else {
            throw new Error("PDF Blob was not generated.");
        }
      } catch (err) {
        console.error("PDF Generation Error:", err);
        setPdfUrl(null);
        setPdfBlob(null);
      } finally {
        setIsLoading(false);
      }
    };

    generatePdf();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedTemplate, transaction, company, party, serviceNameById, bank, client]);

  // Fetch bank details
  React.useEffect(() => {
    // console.log('transaction.bank:', transaction?.bank);
    if (transaction?.bank) {
      if (typeof transaction.bank === 'object' && (transaction.bank as any).bankName) {
        // Already populated Bank object
        setBank(transaction.bank);
      } else {
        // Need to fetch
        const bankId = typeof transaction.bank === 'string' ? transaction.bank : (transaction.bank as any)?.$oid || (transaction.bank as any)?._id;
        // console.log('bankId:', bankId);
        if (bankId && baseURL) {
          fetch(`${baseURL}/api/bank-details/${bankId}`)
            .then(res => res.json())
            .then(data => {
              // console.log('fetched bank:', data);
              setBank(data);
            })
            .catch(err => console.error('Failed to fetch bank:', err));
        } else {
            setBank(null);
        }
      }
    } else {
      setBank(null);
    }
  }, [transaction?.bank, baseURL]);


  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `invoice-${transaction?._id.slice(-6)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleTemplateChange = React.useCallback((v: string) => {
    setSelectedTemplate(v as TemplateKey);
  }, []);

  // If in edit mode, render the enhanced editor
  if (editMode) {
    console.log(
      "🎨 Edit mode active, PDF blob available:",
      !!pdfBlob,
      "Loading:",
      isLoading
    );
    return (
      <div className="max-h-[80vh] overflow-auto">
        <EnhancedInvoicePreview
          transaction={transaction}
          company={company}
          party={party}
          serviceNameById={serviceNameById}
          initialPdfBlob={pdfBlob}
          onExitEditMode={onCancel}
        />
      </div>
    );
  }

  return (
    <>
      <div className="p-6 flex-1 min-h-0">
        <div className="bg-secondary rounded-lg overflow-auto h-full w-full">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="ml-3">Generating PDF Preview...</p>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="Invoice Preview"
            />
          ) : (
            <div className="flex justify-center items-center h-full">
              <p>Could not generate PDF preview.</p>
            </div>
          )}
        </div>
      </div>
      <DialogFooter className="p-6 pt-4 bg-background border-t flex-col sm:flex-row items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <label className="text-sm font-medium text-muted-foreground">
              Invoice Template
            </label>
          </div>
        </div>
        <div className="w-full sm:w-48">
          <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="template1">Template 1</SelectItem>
             {/*  <SelectItem value="template2">Creative</SelectItem>
              <SelectItem value="template3">Modern</SelectItem>
              <SelectItem value="template4">Minimal</SelectItem>
              <SelectItem value="template5">Refined</SelectItem>
              <SelectItem value="template6">Standard</SelectItem>
              <SelectItem value="template7">Prestige</SelectItem>
              <SelectItem value="template8">Template 8 (React)</SelectItem>
              <SelectItem value="template16">new</SelectItem>
              <SelectItem value="template17">new2</SelectItem>
              <SelectItem value="template20">Template20 (React)</SelectItem>
              <SelectItem value="template21">Template21 (React)</SelectItem>
              <SelectItem value="template7">Prestige</SelectItem> */}
              {/* priya  */}
              <SelectItem value="template8">Template 2</SelectItem>
            {/* <SelectItem value="template8">Template 8</SelectItem>  */}
              <SelectItem value="template11">Template 3</SelectItem>
               <SelectItem value="template12">Template 4</SelectItem>
                <SelectItem value="template16">Template 5</SelectItem>
                <SelectItem value="template17">Template 6</SelectItem>
                <SelectItem value="template19">Template 7</SelectItem>
              <SelectItem value="templateA5">Template A5</SelectItem>
              <SelectItem value="templateA5_2">Template A5-2</SelectItem>
              <SelectItem value="templateA5_3">Template A5-3</SelectItem>
              <SelectItem value="templateA5_4">Template A5-4</SelectItem>
               <SelectItem value="template-t3">Template T3</SelectItem>  
              <SelectItem value="template18">Template T3-2</SelectItem>
              {/* amit  */}


            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleDownload} disabled={isLoading || !pdfUrl}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </DialogFooter>
    </>
  );
}