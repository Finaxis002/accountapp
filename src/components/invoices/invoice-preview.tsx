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
import {
  generatePdfForTemplate1,
  generatePdfForTemplate2,
  generatePdfForTemplate3,
} from "@/lib/pdf-templates";

interface InvoicePreviewProps {
  transaction: Transaction | null;
  company: Company | null;
  party: Party | null;
}

export function InvoicePreview({
  transaction,
  company,
  party,
}: InvoicePreviewProps) {
  const [selectedTemplate, setSelectedTemplate] = React.useState("template1");
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let objectUrl: string | null = null;

    const generatePdf = async () => {
      if (!transaction) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // 👉 Always produce a Promise, then await it
        const docPromise =
          selectedTemplate === "template1"
            ? Promise.resolve(
                generatePdfForTemplate1(transaction, company, party)
              )
            : selectedTemplate === "template2"
            ? Promise.resolve(
                generatePdfForTemplate2(transaction, company, party)
              )
            : generatePdfForTemplate3(transaction, company, party); // <-- async

        const doc = await docPromise; // <-- IMPORTANT

        const pdfBlob = doc.output("blob");
        objectUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(objectUrl);
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
  }, [selectedTemplate, transaction, company, party]);

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
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="template1">Professional</SelectItem>
              <SelectItem value="template2">Creative</SelectItem>
              <SelectItem value="template3">Modern</SelectItem>
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
