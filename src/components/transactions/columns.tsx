"use client";

import { ColumnDef, FilterFn, Row } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Download,
  MoreHorizontal,
  Copy,
  Edit,
  Trash2,
  Building,
  Package,
  Eye,
  Server,
  Send,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { Transaction, Company, Party } from "@/lib/types";
import { generatePdfForTemplate1 } from "@/lib/pdf-template1";
import { generatePdfForTemplate11 } from "@/lib/pdf-template11";
import { generatePdfForTemplate12 } from "@/lib/pdf-template12";
import { generatePdfForTemplate16 } from "@/lib/pdf-template16";
import { generatePdfForTemplateA5 } from "@/lib/pdf-templateA5";
import { generatePdfForTemplateA5_3 } from "@/lib/pdf-templateA5-3";
import { generatePdfForTemplateA5_4 } from "@/lib/pdf-templateA5-4";
import { generatePdfForTemplatet3 } from "@/lib/pdf-template-t3";
import { getUnifiedLines } from "@/lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { FaWhatsapp } from "react-icons/fa";
import { useToast } from "@/components/ui/use-toast";
import { PaymentMethodCell } from "./payment-method-cell";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Import the WhatsApp composer dialog
import { WhatsAppComposerDialog } from "./whatsapp-composer-dialog";
import { whatsappConnectionService } from "@/lib/whatsapp-connection";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";

interface ColumnsProps {
  onPreview: (transaction: Transaction) => void;
  onViewItems: (tx: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  companyMap: Map<string, string>;
  serviceNameById: Map<string, string>;
  onSendInvoice: (tx: Transaction) => void;
  onSendWhatsApp?: (transaction: Transaction) => void;
  serviceMap?: Map<string, string>;
  hideActions?: boolean;
  userRole?: string;
}

/** Build a filter function that can match party/vendor, description and line names */
const makeCustomFilterFn = (
  serviceNameById: Map<string, string>
): FilterFn<Transaction> => {
  return (row, _columnId, filterValue) => {
    if (!filterValue) return true;

    const tx = row.original;
    const q = String(filterValue).toLowerCase();

    // party / vendor
    let partyName = "";
    const pv = tx.party || tx.vendor;
    if (pv && typeof pv === "object") {
      partyName = (pv as any).name || (pv as any).vendorName || "";
    }

    const desc = (tx.description || tx.narration || "").toLowerCase();

    // lines (products/services)
    const lines = getUnifiedLines(tx, serviceNameById);
    const matchLine = lines.some((l: { name?: string }) =>
      (l.name || "").toLowerCase().includes(q)
    );

    return partyName.toLowerCase().includes(q) || desc.includes(q) || matchLine;
  };
};

// const printInvoice = async (
//   transaction: Transaction,
//   company?: Company,
//   party?: Party,
//   serviceNameById?: Map<string, string>
// ) => {
//   try {
//     const pdfBlob = await generatePdfForTemplate1(
//       transaction,
//       company,
//       party,
//       serviceNameById
//     );

//     const pdfUrl = URL.createObjectURL(pdfBlob);

//     // Create iframe for printing
//     const iframe = document.createElement("iframe");
//     iframe.style.display = "none";
//     iframe.src = pdfUrl;

//     document.body.appendChild(iframe);

//     iframe.onload = () => {
//       try {
//         // Wait a bit for PDF to load completely
//         setTimeout(() => {
//           iframe.contentWindow?.print();

//           // Clean up after printing
//           setTimeout(() => {
//             document.body.removeChild(iframe);
//             URL.revokeObjectURL(pdfUrl);
//           }, 1000);
//         }, 500);
//       } catch (printError) {
//         console.error("Print failed:", printError);
//         document.body.removeChild(iframe);
//         URL.revokeObjectURL(pdfUrl);
//         throw new Error("Printing failed - please try downloading instead");
//       }
//     };
//   } catch (error) {
//     console.error("Error printing invoice:", error);
//     throw new Error("Failed to generate print document");
//   }
// };

const printInvoice = async (
  transaction: Transaction,
  company?: Company,
  party?: Party,
  serviceNameById?: Map<string, string>
) => {
  try {
    const pdfBlob = await generatePdfForTemplate1(
      transaction,
      company,
      party,
      serviceNameById
    );

    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Create iframe for printing
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.src = pdfUrl;

    document.body.appendChild(iframe);

    iframe.onload = () => {
      try {
        // Wait a bit for PDF to load completely
        setTimeout(() => {
          iframe.contentWindow?.focus(); // Focus on the iframe first
          iframe.contentWindow?.print();

          // Listen for afterprint event to clean up
          const cleanup = () => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(pdfUrl);
            iframe.contentWindow?.removeEventListener('afterprint', cleanup);
          };

          // Add afterprint event listener
          iframe.contentWindow?.addEventListener('afterprint', cleanup);
          
          // Fallback cleanup in case afterprint doesn't fire
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
              URL.revokeObjectURL(pdfUrl);
            }
          }, 30000); // 30 second fallback

        }, 1000); // Increased to 1 second for better loading
      } catch (printError) {
        console.error("Print failed:", printError);
        document.body.removeChild(iframe);
        URL.revokeObjectURL(pdfUrl);
        throw new Error("Printing failed - please try downloading instead");
      }
    };

    // Handle iframe loading errors
    iframe.onerror = () => {
      console.error("Failed to load PDF in iframe");
      document.body.removeChild(iframe);
      URL.revokeObjectURL(pdfUrl);
      throw new Error("Failed to load PDF for printing");
    };

  } catch (error) {
    console.error("Error printing invoice:", error);
    throw new Error("Failed to generate print document");
  }
};


export const columns = ({
  onPreview,
  onViewItems,
  onEdit,
  onDelete,
  companyMap,
  serviceNameById,
  onSendInvoice,
  onSendWhatsApp,
  hideActions = false,
  userRole,
}: ColumnsProps): ColumnDef<Transaction>[] => {
  const customFilterFn = makeCustomFilterFn(serviceNameById);

  const baseColumns: ColumnDef<Transaction>[] = [
    // SELECT COLUMN
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },

    // PARTY / DETAILS
    {
      accessorKey: "party",
      header: "Party / Details",
      filterFn: customFilterFn,
      cell: ({ row }) => {
        const transaction = row.original;

        if (transaction.type === "journal") {
          return (
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>JE</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">Journal Entry</div>
                <div className="text-sm text-muted-foreground">
                  {transaction.debitAccount} / {transaction.creditAccount}
                </div>
              </div>
            </div>
          );
        }

        const partyOrVendor = transaction.party || transaction.vendor;
        let partyName = "N/A";
        if (partyOrVendor && typeof partyOrVendor === "object") {
          if ("name" in partyOrVendor) {
            partyName = (partyOrVendor as any).name;
          } else if ("vendorName" in partyOrVendor) {
            partyName = (partyOrVendor as any).vendorName;
          }
        }

        return (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>
                {partyName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{partyName || "N/A"}</div>
              <div className="text-sm text-muted-foreground hidden sm:block truncate max-w-xs">
                {transaction.description || transaction.narration || ""}
              </div>
            </div>
          </div>
        );
      },
    },

    // COMPANY
    {
      accessorKey: "company",
      header: "Company",
      cell: ({ row }: { row: Row<Transaction> }) => {
        const company = row.original.company;
        const companyId =
          typeof company === "object" && company !== null
            ? (company as any)._id
            : company;

        if (!companyId) return "N/A";

        const companyName = companyMap?.get(companyId as string) || "N/A";
        return (
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span className="hidden sm:inline">{companyName}</span>
            <span className="sm:hidden text-sm">{companyName}</span>
          </div>
        );
      },
    },

    // LINES (ITEMS/SERVICES)
    {
      id: "lines",
      header: "Items / Services",
      cell: ({ row }) => {
        const tx = row.original as any;
        const lines = getUnifiedLines(tx, serviceNameById);
        if (!lines.length)
          return <span className="text-muted-foreground">-</span>;

        const MAX_DISPLAY = 2;
        const displayLines = lines.slice(0, MAX_DISPLAY);
        const remainingCount = lines.length - MAX_DISPLAY;

        const fullList = (
          <div className="space-y-2">
            {lines.map((l: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                {l.type === "product" ? (
                  <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <Server className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="truncate font-medium">{l.name}</div>
                  {l.type === "product" && (
                    <div className="text-xs text-muted-foreground">
                      {l.quantity}
                      {l.unitType ? ` ${l.unitType}` : ""}
                      {l.pricePerUnit
                        ? ` @ ${new Intl.NumberFormat("en-IN").format(
                            Number(l.pricePerUnit)
                          )}`
                        : ""}
                    </div>
                  )}
                  {l.type === "service" && l.description && (
                    <div className="text-xs text-muted-foreground truncate">
                      {l.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        );

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="flex items-center -space-x-2 cursor-pointer"
                  onClick={() => onViewItems(row.original)}
                >
                  {displayLines.map((l: any, idx: number) => (
                    <Avatar
                      key={idx}
                      className="h-7 w-7 border-2 border-background"
                    >
                      <AvatarFallback className="text-xs">
                        {l.type === "product" ? (
                          <Package className="h-4 w-4" />
                        ) : (
                          <Server className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {remainingCount > 0 && (
                    <Avatar className="h-7 w-7 border-2 border-background">
                      <AvatarFallback className="text-xs font-semibold">
                        +{remainingCount}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent className="p-4" side="bottom" align="start">
                {fullList}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },

    // Payment Method
    {
      accessorKey: "paymentMethod",
      header: "Payment Method",
      cell: ({ row }) => {
        return <PaymentMethodCell transaction={row.original} />;
      },
    },

    // AMOUNT
    // {
    //   accessorKey: "totalAmount",
    //   header: ({ column }) => (
    //     <Button
    //       variant="ghost"
    //       onClick={() => column.toggleSorting(column.getIsSomePageRowsSelected() === "asc")}
    //       className="text-right w-full justify-end px-0"
    //     >
    //       Amount
    //       <ArrowUpDown className="ml-2 h-4 w-4" />
    //     </Button>
    //   ),
    //   meta: { label: "Amount" },
    //   cell: ({ row }) => {
    //     const amount = parseFloat(
    //       String(row.original.totalAmount || (row.original as any).amount || 0)
    //     );
    //     const formatted = new Intl.NumberFormat("en-IN", {
    //       style: "currency",
    //       currency: "INR",
    //     }).format(amount);

    //     return <div className="text-right font-medium">{formatted}</div>;
    //   },
    // },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-right w-full justify-end px-0"
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      meta: { label: "Amount" },
      cell: ({ row }) => {
        const amount = parseFloat(
          String(row.original.totalAmount || (row.original as any).amount || 0)
        );
        const formatted = new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(amount);

        return <div className="text-right font-medium">{formatted}</div>;
      },
    },

    // DATE
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) =>
        new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date(row.getValue("date") as string)),
    },

    // TYPE
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;

        const typeStyles: Record<string, string> = {
          sales: "bg-green-500/20 text-green-700 dark:text-green-300",
          purchases: "bg-orange-500/20 text-orange-700 dark:text-orange-300",
          proforma: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300",
          receipt: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
          payment: "bg-red-500/20 text-red-700 dark:text-red-300",
          journal: "bg-purple-500/20 text-purple-700 dark:text-purple-300",
        };

        const variant = type === "sales" ? "default" : "secondary";
        return (
          <Badge variant={variant} className={typeStyles[type] ?? ""}>
            {type}
          </Badge>
        );
      },
    },
  ];

  // Conditionally add actions column
  if (!hideActions) {
    baseColumns.push({
      id: "actions",
      cell: ({ row }) => {
        const transaction = row.original;
        const { toast } = useToast();
        const router = useRouter();
        const [partyDetails, setPartyDetails] = useState<Party | null>(null);
        const [isLoadingParty, setIsLoadingParty] = useState(false);
        const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);

        const [dropdownOpen, setDropdownOpen] = useState(false);
        const [emailDialogOpen, setEmailDialogOpen] = useState(false);
        // Invoice actions are allowed for sales and proforma
        const isInvoiceable =
          transaction.type === "sales" || transaction.type === "proforma";

        // WhatsApp allowed for both sales and receipts
        const isWhatsAppAllowed =
          transaction.type === "sales" || transaction.type === "receipt";

        // Extract basic party info from transaction
        const getBasicPartyInfo = () => {
          const pv = (transaction as any).party || (transaction as any).vendor;
          if (pv && typeof pv === "object") {
            return {
              _id: pv._id,
              name: pv.name || pv.vendorName || "Customer",
            };
          }
          return null;
        };

        const basicParty = getBasicPartyInfo();

        // Fetch complete party details when needed (for WhatsApp)
        const fetchPartyDetails = async () => {
          if (!basicParty?._id) return;

          setIsLoadingParty(true);
          try {
            const token = localStorage.getItem("token");
            const baseURL =
              process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8745";

            const response = await fetch(
              `${baseURL}/api/parties/${basicParty._id}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (response.ok) {
              const data = await response.json();
              setPartyDetails(data);
              return data;
            } else {
              console.error("Failed to fetch party details for WhatsApp");
              return null;
            }
          } catch (error) {
            console.error("Error fetching party details for WhatsApp:", error);
            return null;
          } finally {
            setIsLoadingParty(false);
          }
        };

        // Fetch company details when needed (for email)
        const fetchCompanyDetails = async (companyId: string) => {
          try {
            const token = localStorage.getItem("token");
            const baseURL =
              process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8745";
            const response = await fetch(
              `${baseURL}/api/companies/${companyId}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            if (response.ok) {
              const data = await response.json();
              return data;
            } else {
              console.error("Failed to fetch company details");
              return null;
            }
          } catch (error) {
            console.error("Error fetching company details:", error);
            return null;
          }
        };

        // Build invoice email HTML
        const buildInvoiceEmailHTML = (opts: {
          companyName: string;
          partyName?: string | null;
          supportEmail?: string | null;
          supportPhone?: string | null;
          logoUrl?: string | null;
        }) => {
          const {
            companyName,
            partyName = "Customer",
            supportEmail = "",
            supportPhone = "",
            logoUrl,
          } = opts;

          const contactLine = supportEmail
            ? `for any queries, feel free to contact us at <a href="mailto:${supportEmail}" style="color:#2563eb;text-decoration:none;">${supportEmail}</a>${
                supportPhone ? ` or ${supportPhone}` : ""
              }.`
            : `for any queries, feel free to contact us${
                supportPhone ? ` at ${supportPhone}` : ""
              }.`;

          return `
<table role="presentation" width="100%" style="background:#f5f7fb;padding:24px 12px;margin:0;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
        <tr>
          <td style="background:#111827;color:#fff;padding:16px 24px;">
            <div style="display:flex;align-items:center;gap:12px;">
              ${
                logoUrl
                  ? `<img src="${logoUrl}" alt="${companyName}" width="32" height="32" style="border-radius:6px;display:inline-block;">`
                  : ``
              }
              <span style="font-size:18px;font-weight:700;letter-spacing:.3px;">${companyName}</span>
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 24px 8px;">
            <p style="margin:0 0 12px 0;font-size:16px;color:#111827;">Dear ${partyName},</p>
            <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#374151;">
              Thank you for choosing ${companyName}. Please find attached the invoice for your recent purchase.
              We appreciate your business and look forward to serving you again.
            </p>

            <div style="margin:18px 0;padding:14px 16px;border:1px solid #e5e7eb;background:#f9fafb;border-radius:10px;font-size:14px;color:#111827;">
              Your invoice is attached as a PDF.
            </div>

            <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#374151;">
              ${contactLine}
            </p>

            <p style="margin:24px 0 0 0;font-size:14px;color:#111827;">
              Warm regards,<br>
              <strong>${companyName}</strong><br>
              ${
                supportEmail
                  ? `<a href="mailto:${supportEmail}" style="color:#2563eb;text-decoration:none;">${supportEmail}</a>`
                  : ``
              }
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#f9fafb;color:#6b7280;font-size:12px;text-align:center;padding:12px 24px;border-top:1px solid #e5e7eb;">
            This is an automated message regarding your invoice. Please reply to the address above if you need help.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
        };

        const buildCompany = (): Company | undefined => {
          const c = transaction.company as any;
          const companyId = typeof c === "object" && c ? c._id : c;
          const companyName = companyId
            ? companyMap.get(companyId as string)
            : undefined;
          return companyName
            ? ({ businessName: companyName } as unknown as Company)
            : undefined;
        };

        const buildPartyForInvoice = (): Party | undefined => {
          const pv = (transaction as any).party || (transaction as any).vendor;
          return pv && typeof pv === "object" ? (pv as Party) : undefined;
        };

        // const handleDownload = () => {
        //   const doc = generatePdfForTemplate1(
        //     transaction,
        //     buildCompany(),
        //     buildPartyForInvoice(),
        //     serviceNameById
        //   );
        //   const fname = `Invoice-${(transaction._id ?? "INV")
        //     .toString()
        //     .slice(-6)
        //     .toUpperCase()}.pdf`;
        //   // doc.save(fname);
        // };

        const handleDownload = async () => {
          if (!isInvoiceable) {
            toast({
              variant: "destructive",
              title: "Cannot Download",
              description:
                "Only sales and proforma transactions can be downloaded as invoices.",
            });
            return;
          }

          try {
            const pdfBlob = await generatePdfForTemplate1(
              transaction,
              buildCompany(),
              buildPartyForInvoice(),
              serviceNameById
            );

            // Create download link
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement("a");
            link.href = url;

            const invoiceNumber =
              transaction.invoiceNumber || transaction.referenceNumber;
            const fname = `Invoice-${
              invoiceNumber ||
              (transaction._id ?? "INV").toString().slice(-6).toUpperCase()
            }.pdf`;
            link.download = fname;

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up
            URL.revokeObjectURL(url);

            toast({
              title: "Invoice Downloaded",
              description: `Invoice saved as ${fname}`,
            });
          } catch (error) {
            console.error("Error downloading invoice:", error);
            toast({
              variant: "destructive",
              title: "Download Failed",
              description: "Could not download invoice. Please try again.",
            });
          }
        };

        const handlePrintInvoice = () => {
          setDropdownOpen(false);
          if (!isInvoiceable) {
            toast({
              variant: "destructive",
              title: "Cannot Print",
              description:
                "Only sales transactions can be printed as invoices.",
            });
            return;
          }

          try {
            printInvoice(
              transaction,
              buildCompany(),
              buildPartyForInvoice(),
              serviceNameById
            );

            toast({
              title: "Printing Invoice",
              description: "Opening print dialog...",
            });
          } catch (error) {
            console.error("Print error:", error);
            toast({
              variant: "destructive",
              title: "Print Failed",
              description:
                "Could not print invoice. Please try downloading instead.",
            });
          }
        };

        const handleSendWhatsApp = async () => {
          setDropdownOpen(false);
          // Fetch party details if we don't have them
          let partyToUse = partyDetails;
          if (!partyToUse && basicParty?._id) {
            partyToUse = await fetchPartyDetails();
          }

          if (!partyToUse) {
            toast({
              variant: "destructive",
              title: "Customer Information Missing",
              description:
                "Unable to find customer details for this transaction.",
            });
            return;
          }

          // ✅ BETTER: Use async method for accurate check
          const isConnected =
            await whatsappConnectionService.checkWhatsAppWebConnection();

          if (!isConnected) {
            toast({
              title: "Connect WhatsApp",
              description: "Please connect your WhatsApp to send messages.",
            });
          }

          // If connected, open the composer directly
          setIsWhatsAppDialogOpen(true);
        };

     const handleSendInvoiceEmail = async () => {
  setDropdownOpen(false);

  if (!isInvoiceable) {
    toast({
      variant: "destructive",
      title: "Cannot Send Email",
      description: "Only sales and proforma transactions can be emailed as invoices.",
    });
    return;
  }

  try {
    console.log("Starting email process...");

    // First, check email connection status
    const token = localStorage.getItem("token");
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8745";

    const statusRes = await fetch(`${baseURL}/api/integrations/gmail/status`, {
      headers: { Authorization: `Bearer ${token || ""}` },
    });

    if (!statusRes.ok) {
      throw new Error("Failed to check email status");
    }

    const emailStatus = await statusRes.json();
    console.log("Email status:", emailStatus);

    // If not connected, show the dialog
    if (!emailStatus.connected) {
      setEmailDialogOpen(true);
      return;
    }

    // Get party ID from transaction
    const pv = (transaction as any).party || (transaction as any).vendor;
    let partyId: string | null = null;

    if (pv && typeof pv === 'object') {
      partyId = pv._id;
      console.log("Party/vendor from transaction:", pv);
    }

    if (!partyId) {
      toast({
        variant: "destructive",
        title: "Customer Information Missing",
        description: "Unable to find customer details for this transaction.",
      });
      return;
    }

    // ✅ FIX: Always fetch complete party details to get email
    console.log("Fetching complete party details for ID:", partyId);
    const partyToUse = await fetchPartyDetails();

    if (!partyToUse) {
      toast({
        variant: "destructive",
        title: "Customer Information Missing",
        description: "Unable to fetch customer details for this transaction.",
      });
      return;
    }

    console.log("Complete party details:", partyToUse);

    if (!partyToUse.email) {
      toast({
        variant: "destructive",
        title: "No customer email",
        description: "The selected customer does not have an email address.",
      });
      return;
    }

    console.log("Party email found:", partyToUse.email);

    // Rest of your existing code continues...
    // Fetch company details
    const companyId = transaction.company as any;
    const companyIdStr = typeof companyId === "object" && companyId ? companyId._id : companyId;

    if (!companyIdStr) {
      toast({
        variant: "destructive",
        title: "Company Information Missing",
        description: "Unable to find company details for this transaction.",
      });
      return;
    }

    const companyToUse = await fetchCompanyDetails(companyIdStr);
    if (!companyToUse) {
      toast({
        variant: "destructive",
        title: "Company Information Missing",
        description: "Unable to find company details for this transaction.",
      });
      return;
    }

    // Generate PDF
    let pdfBase64: string;
    try {
      const pdfBlob = await generatePdfForTemplate1(
        transaction,
        companyToUse,
        partyToUse,
        serviceNameById
      );

      // Convert blob to base64
      pdfBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          resolve(dataUrl.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });
    } catch (pdfError) {
      console.error('PDF generation failed:', pdfError);
      toast({
        variant: "destructive",
        title: "PDF Generation Failed",
        description: "Could not generate invoice PDF. Please try again.",
      });
      return;
    }

    // Prepare email data
    const subject = `Invoice From ${companyToUse.businessName || "Your Company"}`;
    const bodyHtml = buildInvoiceEmailHTML({
      companyName: companyToUse.businessName || "Your Company",
      partyName: partyToUse.name || "Customer",
      supportEmail: companyToUse.emailId || "",
      supportPhone: companyToUse.mobileNumber || "",
    });

    const fileName = `${transaction.invoiceNumber || transaction.referenceNumber || "invoice"}.pdf`;

    console.log("Sending email to:", partyToUse.email);
    console.log("Subject:", subject);
    console.log("File name:", fileName);
    console.log("PDF base64 length:", pdfBase64.length);

    // Send email request
    try {
      const emailRes = await fetch(`${baseURL}/api/integrations/gmail/send-invoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: partyToUse.email,
          subject,
          html: bodyHtml,
          fileName,
          pdfBase64,
          companyId: companyIdStr,
          sendAs: "companyOwner",
        }),
      });

      console.log("Email response status:", emailRes.status);

      if (emailRes.ok) {
        const responseData = await emailRes.json();
        console.log("Email sent successfully:", responseData);

        toast({
          title: `Mail sent successfully to ${partyToUse.email}`,
        });
      } else {
        let errorData;
        try {
          errorData = await emailRes.json();
        } catch {
          errorData = { message: 'Unknown error occurred' };
        }

        console.error("Email send failed:", errorData);
        toast({
          variant: "destructive",
          title: "Gmail not found",
        });
      }
    } catch (fetchError) {
      console.error("Network error sending email:", fetchError);
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Could not connect to email service. Please check your connection.",
      });
    }

  } catch (error) {
    console.error("Unexpected error in email sending:", error);
    toast({
      variant: "destructive",
      title: "Unexpected Error",
      description: "An unexpected error occurred while sending the email.",
    });
  }
};


console.log("role :", userRole)

        return (
          <>
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>

                {/* WhatsApp Send - For both sales and receipts if they have contact numbers */}
                <DropdownMenuItem
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await handleSendWhatsApp();
                  }}
                  disabled={!isWhatsAppAllowed || isLoadingParty}
                >
                  <FaWhatsapp className="mr-2 h-4 w-4 text-green-600" />
                  <span>
                    {isLoadingParty ? "Loading..." : "Send on WhatsApp"}
                    {!isWhatsAppAllowed &&
                      ` (${transaction.type} not supported)`}
                  </span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={async (e) => {
                    console.log(
                      "Send Invoice via Mail clicked, isInvoiceable:",
                      isInvoiceable
                    );
                    e.preventDefault();
                    e.stopPropagation();
                    await handleSendInvoiceEmail();
                  }}
                  disabled={!isInvoiceable}
                >
                  <Send className="mr-2 h-4 w-4" />
                  <span>
                    Send Invoice via Mail {!isInvoiceable && "(Sales only)"}
                  </span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() =>
                    navigator.clipboard.writeText(String(transaction._id || ""))
                  }
                >
                  <Copy className="mr-2 h-4 w-4" />
                  <span>Copy transaction ID</span>
                </DropdownMenuItem>

                {/* Preview / Download enabled only for sales */}
                <DropdownMenuItem
                  onClick={() => onPreview(transaction)}
                  disabled={!isInvoiceable}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  <span>
                    Preview Invoice {!isInvoiceable && "(Sales only)"}
                  </span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  // onClick={handleDownload}
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await handleDownload();
                  }}
                  disabled={!isInvoiceable}
                >
                  <Download className="mr-2 h-4 w-4" />
                  <span>
                    Download Invoice {!isInvoiceable && "(Sales only)"}
                  </span>
                </DropdownMenuItem>

                {/* 🖨️ Print Invoice - Only for sales */}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePrintInvoice();
                  }}
                  disabled={!isInvoiceable}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  <span>Print Invoice {!isInvoiceable && "(Sales only)"}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => onEdit(transaction)}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Edit transaction</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => onDelete(transaction)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete transaction</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Email Not Connected Dialog */}
            <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {userRole === "client"
                      ? "Email invoicing is enabled for your account"
                      : "Email invoicing requires setup"}
                  </DialogTitle>
                  <DialogDescription>
                    {userRole === "client"
                      ? "Your administrator has granted you permission to send invoices via email. Please review and accept the terms to activate this feature."
                      : "Email invoicing has been enabled for your account, but you need to contact your administrator to set up the email integration."}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    <span className="text-sm font-medium">Email account</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {userRole === "client"
                      ? "Accept terms first to connect an email."
                      : "Please contact your administrator to configure email settings."}
                  </p>
                </div>
                 {userRole === "client" &&
                <DialogFooter>
                  <Button
                    onClick={() => {
                      setEmailDialogOpen(false);
                      if (userRole === "client") {
                        router.push('/profile?tab=permissions');
                      }
                    }}
                  >
                    Go to Permissions
                  </Button>
                  
                </DialogFooter>
      }
              </DialogContent>
            </Dialog>

            {/* WhatsApp Composer Dialog */}
            <WhatsAppComposerDialog
              isOpen={isWhatsAppDialogOpen}
              onClose={() => setIsWhatsAppDialogOpen(false)}
              transaction={transaction}
              party={
                partyDetails || basicParty || { _id: "", name: "Customer" }
              }
              company={buildCompany() || { businessName: "Company" }}
            />
          </>
        );
      },
    });
  }

  return baseColumns;
};
