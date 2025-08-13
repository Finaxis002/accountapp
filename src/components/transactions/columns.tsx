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
  List,
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
import type { Transaction, Item, Company, Party } from "@/lib/types";
import { generatePdfForTemplate1 } from "@/lib/pdf-templates";

interface ColumnsProps {
  onPreview: (transaction: Transaction) => void;
  onViewItems: (items: Item[]) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  companyMap: Map<string, string>;
}

const customFilterFn: FilterFn<Transaction> = (row, columnId, filterValue) => {
  if (!filterValue) return true;

  const transaction = row.original;
  const searchTerm = String(filterValue).toLowerCase();

  let partyName = "";
  const partyOrVendor = transaction.party || transaction.vendor;
  if (partyOrVendor && typeof partyOrVendor === "object") {
    if ("name" in partyOrVendor && partyOrVendor.name) {
      partyName = partyOrVendor.name;
    } else if ("vendorName" in partyOrVendor && partyOrVendor.vendorName) {
      partyName = partyOrVendor.vendorName;
    }
  }

  const description = transaction.description || "";

  // Check root product and items array products
  const hasMatchingProduct =
    transaction.product?.name?.toLowerCase().includes(searchTerm) ||
    transaction.items?.some((item) =>
      item.product?.name?.toLowerCase().includes(searchTerm)
    );

  return (
    partyName.toLowerCase().includes(searchTerm) ||
    description.toLowerCase().includes(searchTerm) ||
    !!hasMatchingProduct
  );
};

export const columns = ({
  onPreview,
  onViewItems,
  onEdit,
  onDelete,
  companyMap,
}: ColumnsProps): ColumnDef<Transaction>[] => [
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
  {
    accessorKey: "party",
    header: "Party / Details",
    filterFn: customFilterFn,
    cell: ({ row }) => {
      const transaction = row.original;

      if (transaction.type === "journal") {
        return (
          <div>
            <div className="font-medium">Journal Entry</div>
            <div className="text-sm text-muted-foreground">
              {transaction.debitAccount} / {transaction.creditAccount}
            </div>
          </div>
        );
      }

      const partyOrVendor = transaction.party || transaction.vendor;
      let partyName = "";
      if (partyOrVendor && typeof partyOrVendor === "object") {
        if ("name" in partyOrVendor) {
          partyName = partyOrVendor.name;
        } else if ("vendorName" in partyOrVendor) {
          partyName = partyOrVendor.vendorName;
        }
      }

      return (
        <div>
          <div className="font-medium">{partyName || "N/A"}</div>
          <div className="text-sm text-muted-foreground hidden sm:block">
            {transaction.description || transaction.narration || ""}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "company",
    header: "Company",
    cell: ({ row }: { row: Row<Transaction> }) => {
      const company = row.original.company;
      const companyId =
        typeof company === "object" && company !== null ? company._id : company;

      if (!companyId) return "N/A";

      const companyName = companyMap?.get(companyId as string) || "N/A";
      return (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-muted-foreground" />
          <span className="hidden lg:inline">{companyName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "items",
    header: "Product(s)",
    cell: ({ row }) => {
      const { items } = row.original;
      if (!items || items.length === 0) return "N/A";

      if (items.length === 1 && items[0].product) {
        return (
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <div>
              <div>{items[0].product.name}</div>
            </div>
          </div>
        );
      }

      return (
        <Button
          variant="link"
          className="p-0 h-auto"
          onClick={() => onViewItems(items)}
        >
          <List className="h-4 w-4 text-muted-foreground mr-2" />
          Multiple Items ({items.length})
        </Button>
      );
    },
  },
  {
    accessorKey: "totalAmount",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-right w-full justify-end px-0"
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(
        String(row.original.totalAmount || row.original.amount || 0)
      );
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) =>
      new Intl.DateTimeFormat("en-US").format(new Date(row.getValue("date"))),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;

      const typeStyles: { [key: string]: string } = {
        sales: "bg-green-500/20 text-green-700 dark:text-green-300",
        purchases: "bg-orange-500/20 text-orange-700 dark:text-orange-300",
        receipt: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
        payment: "bg-red-500/20 text-red-700 dark:text-red-300",
        journal: "bg-purple-500/20 text-purple-700 dark:text-purple-300",
      };

      const variant = type === "sales" ? "default" : "secondary";
      return (
        <Badge variant={variant} className={typeStyles[type]}>
          {type}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const transaction = row.original;
      const isSales =
        transaction.type === "sales" ||
        (transaction.items && transaction.items.length > 0);

      // helper to build minimal company/party objects for the PDF
      const buildCompany = (): Company | undefined => {
        const c = transaction.company;
        const companyId = typeof c === "object" && c ? c._id : c;
        const companyName = companyId
          ? companyMap.get(companyId as string)
          : undefined;
        return companyName
          ? ({ businessName: companyName } as unknown as Company)
          : undefined;
      };

      const buildParty = (): Party | undefined => {
        const pv = transaction.party || transaction.vendor;
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
              onClick={() => navigator.clipboard.writeText(transaction._id)}
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
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDownload} disabled={!isSales}>
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
