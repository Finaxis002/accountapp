// "use client";

// import { ColumnDef, FilterFn, Row } from "@tanstack/react-table";
// import {
//   ArrowUpDown,
//   Download,
//   MoreHorizontal,
//   Copy,
//   Edit,
//   Trash2,
//   Building,
//   Package,
//   Eye,
//   Server,
//   Send,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Badge } from "@/components/ui/badge";
// import type { Transaction, Company, Party } from "@/lib/types";
// import { generatePdfForTemplate1 } from "@/lib/pdf-templates";
// import { getUnifiedLines } from "@/lib/utils";
// import { Avatar, AvatarFallback } from "../ui/avatar";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "../ui/tooltip";
// import { FaWhatsapp } from "react-icons/fa";
// import { WhatsAppComposer } from "./whatsapp-composer";
// import { PaymentMethodCell } from "./payment-method-cell";
// import { useToast } from "@/components/ui/use-toast";

// interface ColumnsProps {
//   onPreview: (transaction: Transaction) => void;
//   // onDownloadInvoice: (transaction: Transaction) => void;
//   onViewItems: (tx: Transaction) => void;
//   onEdit: (transaction: Transaction) => void;
//   onDelete: (transaction: Transaction) => void;
//   companyMap: Map<string, string>;
//   serviceNameById: Map<string, string>;
//   onSendInvoice: (tx: Transaction) => void;
//   onSendWhatsApp?: (transaction: Transaction) => void;
//   serviceMap?: Map<string, string>;
//   hideActions?: boolean;
// }

// /** Build a filter function that can match party/vendor, description and line names */
// const makeCustomFilterFn = (
//   serviceNameById: Map<string, string>
// ): FilterFn<Transaction> => {
//   return (row, _columnId, filterValue) => {
//     if (!filterValue) return true;

//     const tx = row.original;
//     const q = String(filterValue).toLowerCase();

//     // party / vendor
//     let partyName = "";
//     const pv = tx.party || tx.vendor;
//     if (pv && typeof pv === "object") {
//       partyName = (pv as any).name || (pv as any).vendorName || "";
//     }

//     const desc = (tx.description || tx.narration || "").toLowerCase();

//     // lines (products/services)
//     const lines = getUnifiedLines(tx, serviceNameById);
//     const matchLine = lines.some((l: { name?: string }) =>
//       (l.name || "").toLowerCase().includes(q)
//     );

//     return partyName.toLowerCase().includes(q) || desc.includes(q) || matchLine;
//   };
// };

// export const columns = ({
//   onPreview,
//   // onDownloadInvoice,
//   onViewItems,
//   onEdit,
//   onDelete,
//   companyMap,
//   serviceNameById,
//   onSendInvoice,
//   onSendWhatsApp,
//   hideActions = false,
// }: ColumnsProps): ColumnDef<Transaction>[] => {
//   const customFilterFn = makeCustomFilterFn(serviceNameById);

//   const baseColumns: ColumnDef<Transaction>[] = [
//     // SELECT COLUMN
//     {
//       id: "select",
//       header: ({ table }) => (
//         <Checkbox
//           checked={
//             table.getIsAllPageRowsSelected() ||
//             (table.getIsSomePageRowsSelected() && "indeterminate")
//           }
//           onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
//           aria-label="Select all"
//         />
//       ),
//       cell: ({ row }) => (
//         <Checkbox
//           checked={row.getIsSelected()}
//           onCheckedChange={(value) => row.toggleSelected(!!value)}
//           aria-label="Select row"
//         />
//       ),
//       enableSorting: false,
//       enableHiding: false,
//     },

//     // PARTY / DETAILS
//     {
//       accessorKey: "party",
//       header: "Party / Details",
//       filterFn: customFilterFn,
//       cell: ({ row }) => {
//         const transaction = row.original;

//         if (transaction.type === "journal") {
//           return (
//             <div className="flex items-center gap-3">
//               <Avatar>
//                 <AvatarFallback>JE</AvatarFallback>
//               </Avatar>
//               <div>
//                 <div className="font-medium">Journal Entry</div>
//                 <div className="text-sm text-muted-foreground">
//                   {transaction.debitAccount} / {transaction.creditAccount}
//                 </div>
//               </div>
//             </div>
//           );
//         }

//         const partyOrVendor = transaction.party || transaction.vendor;
//         let partyName = "N/A";
//         if (partyOrVendor && typeof partyOrVendor === "object") {
//           if ("name" in partyOrVendor) {
//             partyName = (partyOrVendor as any).name;
//           } else if ("vendorName" in partyOrVendor) {
//             partyName = (partyOrVendor as any).vendorName;
//           }
//         }

//         return (
//           <div className="flex items-center gap-3">
//             <Avatar>
//               <AvatarFallback>
//                 {partyName.substring(0, 2).toUpperCase()}
//               </AvatarFallback>
//             </Avatar>
//             <div>
//               <div className="font-medium">{partyName || "N/A"}</div>
//               <div className="text-sm text-muted-foreground hidden sm:block truncate max-w-xs">
//                 {transaction.description || transaction.narration || ""}
//               </div>
//             </div>
//           </div>
//         );
//       },
//     },

//     // COMPANY
//     {
//       accessorKey: "company",
//       header: "Company",
//       cell: ({ row }: { row: Row<Transaction> }) => {
//         const company = row.original.company;
//         const companyId =
//           typeof company === "object" && company !== null
//             ? (company as any)._id
//             : company;

//         if (!companyId) return "N/A";

//         const companyName = companyMap?.get(companyId as string) || "N/A";
//         return (
//           <div className="flex items-center gap-2">
//             <Building className="h-4 w-4 text-muted-foreground" />
//             <span className="hidden sm:inline">{companyName}</span>
//             {/* Add mobile view display */}
//             <span className="sm:hidden text-sm">{companyName}</span>{" "}
//             {/* Mobile display */}
//           </div>
//         );
//       },
//     },

//     // LINES (ITEMS/SERVICES)
//     {
//       id: "lines",
//       header: "Items / Services",
//       cell: ({ row }) => {
//         const tx = row.original as any;
//         const lines = getUnifiedLines(tx, serviceNameById);
//         if (!lines.length)
//           return <span className="text-muted-foreground">-</span>;

//         const MAX_DISPLAY = 2;
//         const displayLines = lines.slice(0, MAX_DISPLAY);
//         const remainingCount = lines.length - MAX_DISPLAY;

//         const fullList = (
//           <div className="space-y-2">
//             {lines.map((l: any, idx: number) => (
//               <div key={idx} className="flex items-center gap-2 text-sm">
//                 {l.type === "product" ? (
//                   <Package className="h-4 w-4 text-muted-foreground shrink-0" />
//                 ) : (
//                   <Server className="h-4 w-4 text-muted-foreground shrink-0" />
//                 )}
//                 <div className="min-w-0">
//                   <div className="truncate font-medium">{l.name}</div>
//                   {l.type === "product" && (
//                     <div className="text-xs text-muted-foreground">
//                       {l.quantity}
//                       {l.unitType ? ` ${l.unitType}` : ""}
//                       {l.pricePerUnit
//                         ? ` @ ${new Intl.NumberFormat("en-IN").format(
//                             Number(l.pricePerUnit)
//                           )}`
//                         : ""}
//                     </div>
//                   )}
//                   {l.type === "service" && l.description && (
//                     <div className="text-xs text-muted-foreground truncate">
//                       {l.description}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         );

//         return (
//           <TooltipProvider>
//             <Tooltip>
//               <TooltipTrigger asChild>
//                 <div
//                   className="flex items-center -space-x-2 cursor-pointer"
//                   onClick={() => onViewItems(row.original)}
//                 >
//                   {displayLines.map((l: any, idx: number) => (
//                     <Avatar
//                       key={idx}
//                       className="h-7 w-7 border-2 border-background"
//                     >
//                       <AvatarFallback className="text-xs">
//                         {l.type === "product" ? (
//                           <Package className="h-4 w-4" />
//                         ) : (
//                           <Server className="h-4 w-4" />
//                         )}
//                       </AvatarFallback>
//                     </Avatar>
//                   ))}
//                   {remainingCount > 0 && (
//                     <Avatar className="h-7 w-7 border-2 border-background">
//                       <AvatarFallback className="text-xs font-semibold">
//                         +{remainingCount}
//                       </AvatarFallback>
//                     </Avatar>
//                   )}
//                 </div>
//               </TooltipTrigger>
//               <TooltipContent className="p-4" side="bottom" align="start">
//                 {fullList}
//               </TooltipContent>
//             </Tooltip>
//           </TooltipProvider>
//         );
//       },
//     },

//     // payment method
//     //  {
//     //   accessorKey: "paymentMethod",
//     //   header: "Payment Method",
//     //   cell: ({ row }) => {
//     //     const paymentMethod = (row.original as any).paymentMethod;

//     //     if (!paymentMethod) {
//     //       return <span className="text-muted-foreground">-</span>;
//     //     }

//     //     const paymentMethodStyles: Record<string, string> = {
//     //       Cash: "bg-green-500/20 text-green-700 dark:text-green-300",
//     //       Credit: "bg-orange-500/20 text-red-700 dark:text-red-300 rounded",
//     //       UPI: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
//     //       "Bank Transfer": "bg-purple-500/20 text-purple-700 dark:text-purple-300",
//     //       Cheque: "bg-gray-500/20 text-gray-700 dark:text-gray-300",
//     //     };

//     //     return (
//     //        <>
//     //     <div className="flex items-center gap-1">
//     //       <Badge
//     //         variant="outline"
//     //         className={paymentMethodStyles[paymentMethod] ?? "bg-gray-500/20 text-gray-700 dark:text-gray-300"}
//     //       >
//     //         {paymentMethod}
//     //       </Badge>
//     //       {paymentMethod === "Credit" && (
//     //         <button
//     //           onClick={() => setShowReminderPopup(true)}
//     //           className="p-1 hover:bg-orange-100 dark:hover:bg-orange-900 rounded transition-colors"
//     //           title="View credit reminder details"
//     //         >
//     //           <FaClock className="h-4 w-4 text-orange-500" />
//     //         </button>
//     //       )}
//     //     </div>

//     //     {/* Credit Reminder Popup */}
//     //     {paymentMethod === "Credit" && (
//     //       <CreditReminderPopup
//     //         isOpen={showReminderPopup}
//     //         onClose={() => setShowReminderPopup(false)}
//     //         transaction={transaction}
//     //         party={(transaction as any).party || (transaction as any).vendor}
//     //       />
//     //     )}
//     //   </>
//     //     );
//     //   },
//     // },
//     // In your columns configuration:
//     {
//       accessorKey: "paymentMethod",
//       header: "Payment Method",
//       cell: ({ row }) => {
//         return <PaymentMethodCell transaction={row.original} />;
//       },
//     },
//     // AMOUNT
//     {
//       accessorKey: "totalAmount",
//       header: ({ column }) => (
//         <Button
//           variant="ghost"
//           onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
//           className="text-right w-full justify-end px-0"
//         >
//           Amount
//           <ArrowUpDown className="ml-2 h-4 w-4" />
//         </Button>
//       ),
//       meta: { label: "Amount" },
//       cell: ({ row }) => {
//         const amount = parseFloat(
//           String(row.original.totalAmount || (row.original as any).amount || 0)
//         );
//         const formatted = new Intl.NumberFormat("en-IN", {
//           style: "currency",
//           currency: "INR",
//         }).format(amount);

//         return <div className="text-right font-medium">{formatted}</div>;
//       },
//     },

//     // DATE
//     {
//       accessorKey: "date",
//       header: "Date",
//       cell: ({ row }) =>
//         new Intl.DateTimeFormat("en-GB", {
//           day: "2-digit",
//           month: "short",
//           year: "numeric",
//         }).format(new Date(row.getValue("date") as string)),
//     },

//     // TYPE
//     {
//       accessorKey: "type",
//       header: "Type",
//       cell: ({ row }) => {
//         const type = row.getValue("type") as string;

//         const typeStyles: Record<string, string> = {
//           sales: "bg-green-500/20 text-green-700 dark:text-green-300",
//           purchases: "bg-orange-500/20 text-orange-700 dark:text-orange-300",
//           receipt: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
//           payment: "bg-red-500/20 text-red-700 dark:text-red-300",
//           journal: "bg-purple-500/20 text-purple-700 dark:text-purple-300",
//         };

//         const variant = type === "sales" ? "default" : "secondary";
//         return (
//           <Badge variant={variant} className={typeStyles[type] ?? ""}>
//             {type}
//           </Badge>
//         );
//       },
//     },
//   ];

//   // Conditionally add actions column
//   if (!hideActions) {
//     baseColumns.push({
//       id: "actions",
//       cell: ({ row }) => {
//         // inside actions column cell
//         const transaction = row.original;

//         // Invoice actions are allowed ONLY for sales
//         const isInvoiceable = transaction.type === "sales";

//         const buildCompany = (): Company | undefined => {
//           const c = transaction.company as any;
//           const companyId = typeof c === "object" && c ? c._id : c;
//           const companyName = companyId
//             ? companyMap.get(companyId as string)
//             : undefined;
//           return companyName
//             ? ({ businessName: companyName } as unknown as Company)
//             : undefined;
//         };

//         const buildParty = (): Party | undefined => {
//           const pv = (transaction as any).party || (transaction as any).vendor;
//           return pv && typeof pv === "object" ? (pv as Party) : undefined;
//         };
//         const party = buildParty();
//         const hasContactNumber = party && party.contactNumber;

//         const handleDownload = () => {
//           const doc = generatePdfForTemplate1(
//             transaction,
//             buildCompany(),
//             buildParty(),
//             serviceNameById
//           );
//           const fname = `Invoice-${(transaction._id ?? "INV")
//             .toString()
//             .slice(-6)
//             .toUpperCase()}.pdf`;
//           doc.save(fname);
//         };

//         return (
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button variant="ghost" className="h-8 w-8 p-0">
//                 <span className="sr-only">Open menu</span>
//                 <MoreHorizontal className="h-4 w-4" />
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end">
//               <DropdownMenuLabel>Actions</DropdownMenuLabel>

//               {/* WhatsApp Send - Only for sales and if party has contact number */}
//               <DropdownMenuItem
//                 onClick={(e) => {
//                   e.preventDefault();
//                   e.stopPropagation();

//                   if (!hasContactNumber || !party) {
//                     toast({
//                       variant: "destructive",
//                       title: "Cannot Send WhatsApp",
//                       description: !party
//                         ? "Customer information not available."
//                         : "Customer does not have a contact number.",
//                     });
//                     return;
//                   }

//                   // Build company info
//                   const buildCompany = (): Company | undefined => {
//                     const c = transaction.company as any;
//                     const companyId = typeof c === "object" && c ? c._id : c;
//                     const companyName = companyId
//                       ? companyMap.get(companyId as string)
//                       : undefined;
//                     return companyName
//                       ? ({ businessName: companyName } as unknown as Company)
//                       : undefined;
//                   };

//                   const company = buildCompany();

//                   // Generate WhatsApp message
//                   const phoneNumber = party.contactNumber.replace(/\D/g, "");
//                   let formattedNumber = phoneNumber;
//                   if (
//                     !phoneNumber.startsWith("91") &&
//                     phoneNumber.length === 10
//                   ) {
//                     formattedNumber = `91${phoneNumber}`;
//                   }

//                   const invoiceNumber =
//                     transaction.invoiceNumber ||
//                     transaction.referenceNumber ||
//                     "N/A";
//                   const invoiceDate = new Date(
//                     transaction.date
//                   ).toLocaleDateString();
//                   const pendingAmount =
//                     transaction.totalAmount || (transaction as any).amount || 0;

//                   const message = `Dear ${party.name},

// *Payment Reminder - Invoice ${invoiceNumber}*

// *Invoice Details:*
// 📅 Invoice Date: ${invoiceDate}
// 📋 Invoice Number: ${invoiceNumber}
// 💰 Pending Amount: ₹${new Intl.NumberFormat("en-IN").format(pendingAmount)}

// Please process the payment at your earliest convenience.

// Thank you for your business!

// Best regards,
// ${company?.businessName || "Your Company"}`;

//                   const encodedMessage = encodeURIComponent(message);
//                   const whatsappUrl = `https://web.whatsapp.com/send?phone=${formattedNumber}&text=${encodedMessage}`;

//                   window.open(whatsappUrl, "_blank", "noopener,noreferrer");

//                   // Show success toast
//                   toast({
//                     title: "WhatsApp Opened",
//                     description: `WhatsApp opened for ${party.name}. Please click send to deliver the message.`,
//                   });
//                 }}
//                 disabled={!isInvoiceable || !hasContactNumber}
//               >
//                 <FaWhatsapp className="mr-2 h-4 w-4 text-green-600" />
//                 <span>Send on WhatsApp</span>
//               </DropdownMenuItem>

//               <DropdownMenuItem
//                 onClick={() =>
//                   navigator.clipboard.writeText(String(transaction._id || ""))
//                 }
//               >
//                 <Copy className="mr-2 h-4 w-4" />
//                 <span>Copy transaction ID</span>
//               </DropdownMenuItem>

//               {/* Preview / Download enabled only for sales */}
//               <DropdownMenuItem
//                 onClick={() => onPreview(transaction)}
//                 disabled={!isInvoiceable}
//               >
//                 <Eye className="mr-2 h-4 w-4" />
//                 <span>Preview Invoice</span>
//               </DropdownMenuItem>

//               <DropdownMenuItem
//                 onClick={handleDownload}
//                 disabled={!isInvoiceable}
//               >
//                 <Download className="mr-2 h-4 w-4" />
//                 <span>Download Invoice</span>
//               </DropdownMenuItem>

//               <DropdownMenuSeparator />

//               <DropdownMenuItem onClick={() => onEdit(transaction)}>
//                 <Edit className="mr-2 h-4 w-4" />
//                 <span>Edit transaction</span>
//               </DropdownMenuItem>

//               <DropdownMenuItem
//                 onClick={() => onDelete(transaction)}
//                 className="text-destructive"
//               >
//                 <Trash2 className="mr-2 h-4 w-4" />
//                 <span>Delete transaction</span>
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>
//         );
//       },
//     });
//   }

//   return baseColumns;
// };

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
// import { generatePdfForTemplate2 } from "@/lib/pdf-template2";
// import { generatePdfForTemplate3 } from "@/lib/pdf-template3";
// import { generatePdfForTemplate4 } from "@/lib/pdf-template4";
// import { generatePdfForTemplate5 } from "@/lib/pdf-template5";
// import { generatePdfForTemplate6 } from "@/lib/pdf-template6";
// import { generatePdfForTemplate7 } from "@/lib/pdf-template7";
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

// Import the WhatsApp composer dialog
import { WhatsAppComposerDialog } from "./whatsapp-composer-dialog";
import { whatsappConnectionService } from "@/lib/whatsapp-connection";

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

// const printInvoice = (
//   transaction: Transaction,
//   company?: Company,
//   party?: Party,
//   serviceNameById?: Map<string, string>
// ) => {
//   try {
//     const pdfDoc = generatePdfForTemplate1(
//       transaction,
//       company,
//       party,
//       serviceNameById
//     );

//     // ✅ Use the same approach as download but for printing
//     const pdfBlob = pdfDoc.output('blob');
//     const pdfUrl = URL.createObjectURL(pdfBlob);

//     // Create iframe for printing
//     const iframe = document.createElement('iframe');
//     iframe.style.display = 'none';
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
//         console.error('Print failed:', printError);
//         document.body.removeChild(iframe);
//         URL.revokeObjectURL(pdfUrl);
//         throw new Error('Printing failed - please try downloading instead');
//       }
//     };

//   } catch (error) {
//     console.error('Error printing invoice:', error);
//     throw new Error('Failed to generate print document');
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
    iframe.style.display = "none";
    iframe.src = pdfUrl;

    document.body.appendChild(iframe);

    iframe.onload = () => {
      try {
        // Wait a bit for PDF to load completely
        setTimeout(() => {
          iframe.contentWindow?.print();

          // Clean up after printing
          setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(pdfUrl);
          }, 1000);
        }, 500);
      } catch (printError) {
        console.error("Print failed:", printError);
        document.body.removeChild(iframe);
        URL.revokeObjectURL(pdfUrl);
        throw new Error("Printing failed - please try downloading instead");
      }
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
        const [partyDetails, setPartyDetails] = useState<Party | null>(null);
        const [isLoadingParty, setIsLoadingParty] = useState(false);
        const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);

        const [dropdownOpen, setDropdownOpen] = useState(false);
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
