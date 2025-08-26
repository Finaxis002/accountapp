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
import { generatePdfForTemplate1 } from "@/lib/pdf-templates";
import { getUnifiedLines } from "@/lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface ColumnsProps {
  onPreview: (transaction: Transaction) => void;
  onDownloadInvoice: (transaction: Transaction) => void;
  onViewItems: (tx: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  companyMap: Map<string, string>;
  serviceNameById: Map<string, string>;
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

    return (
      partyName.toLowerCase().includes(q) ||
      desc.includes(q) ||
      matchLine
    );
  };
};

export const columns = ({
  onPreview,
  onDownloadInvoice,
  onViewItems,
  onEdit,
  onDelete,
  companyMap,
  serviceNameById,
}: ColumnsProps): ColumnDef<Transaction>[] => {
  const customFilterFn = makeCustomFilterFn(serviceNameById);

  return [
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>JE</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">Journal Entry</span>
            <span className="text-xs sm:text-sm text-muted-foreground">
              {transaction.debitAccount} / {transaction.creditAccount}
            </span>
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
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            {partyName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col max-w-[200px]">
          <span className="font-medium">{partyName || "N/A"}</span>
          <span className="text-xs sm:text-sm text-muted-foreground truncate">
            {transaction.description || transaction.narration || ""}
          </span>
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
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
        <Building className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs sm:text-sm truncate">{companyName}</span>
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
          <div
            key={idx}
            className="flex items-center gap-2 text-sm bg-muted/30 p-2 rounded-lg"
          >
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
      <>
        {/* Desktop: Avatar + Tooltip */}
        <div className="hidden sm:block">
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
        </div>

        {/* Mobile: Show full list directly */}
        <div className="block sm:hidden max-h-32 overflow-y-auto pr-1 space-y-2">
          {lines.map((l: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-sm bg-muted/40 p-2 rounded-lg shadow-sm"
            >
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
      </>
    );
  },
},

    // AMOUNT
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

    // ACTIONS
    {
      id: "actions",
      cell: ({ row }) => {
        const transaction = row.original;
        const isSales =
          transaction.type === "sales" ||
          getUnifiedLines(transaction as any, serviceNameById).length > 0;

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

        const buildParty = (): Party | undefined => {
          const pv = (transaction as any).party || (transaction as any).vendor;
          return pv && typeof pv === "object" ? (pv as Party) : undefined;
        };

        const handleDownload = () => {
          const doc = generatePdfForTemplate1(
            transaction,
            buildCompany(),
            buildParty()
          );
          const fname = `Invoice-${(transaction._id ?? "INV")
            .toString()
            .slice(-6)
            .toUpperCase()}.pdf`;
          doc.save(fname);
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>

              <DropdownMenuItem
                onClick={() =>
                  navigator.clipboard.writeText(String(transaction._id || ""))
                }
              >
                <Copy className="mr-2 h-4 w-4" />
                <span>Copy transaction ID</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => onPreview(transaction)}
                disabled={!isSales}
              >
                <Eye className="mr-2 h-4 w-4" />
                <span>Preview Invoice</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  if (typeof onDownloadInvoice === "function") {
                    onDownloadInvoice(transaction);
                  } else {
                    handleDownload();
                  }
                }}
                disabled={!isSales}
              >
                <Download className="mr-2 h-4 w-4" />
                <span>Download Invoice</span>
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
        );
      },
    },
  ];
};
