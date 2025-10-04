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
import { Download, FileText, Loader2, Edit } from "lucide-react";
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
import { generatePdfForTemplate1 } from "@/lib/pdf-template1";
import { generatePdfForTemplate2 } from "@/lib/pdf-template2";
import { generatePdfForTemplate3 } from "@/lib/pdf-template3";
import { generatePdfForTemplate4 } from "@/lib/pdf-template4";
import { generatePdfForTemplate5 } from "@/lib/pdf-template5";
import { generatePdfForTemplate6 } from "@/lib/pdf-template6";
import { generatePdfForTemplate7 } from "@/lib/pdf-template7";
import { generatePdfForTemplate16 } from "@/lib/pdf-template16";
import { generatePdfForTemplate17 } from "@/lib/pdf-template17";
import jsPDF from "jspdf";
import { EnhancedInvoicePreview } from "./enhanced-invoice-preview";

type TemplateKey =
  | "template1"
  | "template2"
  | "template3"
  | "template4"
  | "template5"
  | "template6"
  | "template7"
  | "template16"
  | "template17";

interface InvoicePreviewProps {
  transaction: Transaction | null;
  company: Company | null;
  party: Party | null;
  serviceNameById?: Map<string, string>;
  editMode?: boolean;
  onSave?: (updatedTransaction: Transaction) => void;
  onCancel?: () => void;
}

export function InvoicePreview({
  transaction,
  company,
  party,
  serviceNameById,
  editMode = false,
  onSave,
  onCancel,
}: InvoicePreviewProps) {
  const [selectedTemplate, setSelectedTemplate] =
    React.useState<TemplateKey>("template1");

  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  // Use the editMode prop instead of internal state
  const [pdfBlob, setPdfBlob] = React.useState<Blob | null>(null);

  React.useEffect(() => {
    let objectUrl: string | null = null;

    const generatePdf = async () => {
      if (!transaction) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        // ✅ forward serviceNameById to the PDF generators
        let docPromise: Promise<jsPDF>;

        // Extract shipping address from transaction
        const shippingAddress = transaction?.shippingAddress && typeof transaction.shippingAddress === 'object'
          ? transaction.shippingAddress as any
          : null;

        switch (selectedTemplate) {
          case "template1":
            docPromise = Promise.resolve(
              generatePdfForTemplate1(
                transaction,
                company,
                party,
                serviceNameById,
                shippingAddress
              )
            );
            break;
          case "template2":
            docPromise = Promise.resolve(
              generatePdfForTemplate2(
                transaction,
                company,
                party,
                serviceNameById,
                shippingAddress
              )
            );
            break;
          case "template3":
            docPromise = generatePdfForTemplate3(
              transaction,
              company,
              party,
              serviceNameById,
              shippingAddress
            );
            break;
          case "template4":
            docPromise = Promise.resolve(
              generatePdfForTemplate4(
                transaction,
                company,
                party,
                serviceNameById,
                shippingAddress
              )
            );
            break;
          case "template5":
            docPromise = Promise.resolve(
              generatePdfForTemplate5(
                transaction,
                company,
                party,
                serviceNameById,
                shippingAddress
              )
            );
            break;
          case "template6":
            docPromise = Promise.resolve(
              generatePdfForTemplate6(
                transaction,
                company,
                party,
                serviceNameById,
                shippingAddress
              )
            );
            break;
          case "template7":
            docPromise = Promise.resolve(
              generatePdfForTemplate7(
                transaction,
                company,
                party,
                serviceNameById,
                shippingAddress
              )
            );
            break;
          case "template16":
            docPromise = Promise.resolve(
              generatePdfForTemplate16(
                transaction,
                company,
                party,
                serviceNameById,
                shippingAddress
              )
            );
            break;
            case "template17":
            docPromise = Promise.resolve(
              generatePdfForTemplate17(
                transaction,
                company,
                party,
                serviceNameById,
                shippingAddress
              )
            );
            break;
          default:
            docPromise = generatePdfForTemplate3(
              transaction,
              company,
              party,
              serviceNameById,
              shippingAddress
            );
        }

        const doc = await docPromise;
        const pdfBlob = doc.output("blob");
        objectUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(objectUrl);
        setPdfBlob(pdfBlob);
      } catch (err) {
        console.error(err);
        setPdfUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    generatePdf();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedTemplate, transaction, company, party, serviceNameById]);

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

  // add a small adapter so types match Select's signature
  const handleTemplateChange = React.useCallback((v: string) => {
    setSelectedTemplate(v as TemplateKey);
  }, []);

  // If in edit mode, render the enhanced editor
  if (editMode) {
    console.log('🎨 Edit mode active, PDF blob available:', !!pdfBlob, 'Loading:', isLoading);
    return (
      <div className="max-h-[80vh] overflow-auto"><EnhancedInvoicePreview
        transaction={transaction}
        company={company}
        party={party}
        serviceNameById={serviceNameById}
        initialPdfBlob={pdfBlob}
        onExitEditMode={onCancel}
      /></div>
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
              <SelectItem value="template1">Professional</SelectItem>
              <SelectItem value="template2">Creative</SelectItem>
              <SelectItem value="template3">Modern</SelectItem>
              <SelectItem value="template4">Minimal</SelectItem>
              <SelectItem value="template5">Refined</SelectItem>
              <SelectItem value="template6">Standard</SelectItem>
              <SelectItem value="template7">Prestige</SelectItem>
              <SelectItem value="template16">new</SelectItem>
              <SelectItem value="template17">new2</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Edit button removed - now controlled by parent component */}
        <Button onClick={handleDownload} disabled={isLoading || !pdfUrl}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </DialogFooter>
    </>
  );
}
