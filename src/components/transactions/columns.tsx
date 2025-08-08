
"use client"

import { ColumnDef, FilterFn, Row } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Copy, Edit, Trash2, FileDown, Building, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import type { Transaction } from "@/lib/types"

interface ColumnsProps {
  generateInvoicePDF: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  companyMap: Map<string, string>;
}

const customFilterFn: FilterFn<Transaction> = (row, columnId, filterValue) => {
    const transaction = row.original;
    const searchTerm = String(filterValue).toLowerCase();

    let partyName = '';
    const partyOrVendor = transaction.party || transaction.vendor;
    if (partyOrVendor && typeof partyOrVendor === 'object') {
        if ('name' in partyOrVendor) {
            partyName = partyOrVendor.name || '';
        } else if ('vendorName' in partyOrVendor) {
            partyName = partyOrVendor.vendorName || '';
        }
    }

    const description = transaction.description || '';
    const productName = transaction.product?.name || '';
    
    return (
        partyName.toLowerCase().includes(searchTerm) ||
        description.toLowerCase().includes(searchTerm) ||
        productName.toLowerCase().includes(searchTerm)
    );
};


export const columns = ({ generateInvoicePDF, onEdit, onDelete, companyMap }: ColumnsProps): ColumnDef<Transaction>[] => [
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
        
        if (transaction.type === 'journal') {
            return (
                 <div>
                    <div className="font-medium">Journal Entry</div>
                    <div className="text-sm text-muted-foreground">
                        {transaction.debitAccount} / {transaction.creditAccount}
                    </div>
                </div>
            )
        }

        const partyOrVendor = transaction.party || transaction.vendor;
        let partyName = '';
        if (partyOrVendor && typeof partyOrVendor === 'object') {
          if ('name' in partyOrVendor) {
            partyName = partyOrVendor.name;
          } else if ('vendorName' in partyOrVendor) {
            partyName = partyOrVendor.vendorName;
          }
        } else if (typeof partyOrVendor === 'string') {
          // This case might need to fetch the name, but for now, it's a fallback.
          partyName = 'Loading...';
        }
        
        return (
            <div>
                <div className="font-medium">{partyName}</div>
                <div className="text-sm text-muted-foreground">{transaction.description}</div>
            </div>
        )
    }
  },
  {
    accessorKey: "company",
    header: "Company",
    cell: ({ row }: { row: Row<Transaction> }) => {
      const company = row.original.company;
      const companyId = typeof company === 'object' && company !== null ? company._id : company;
        
      if (!companyId) return 'N/A';
      
      const companyName = companyMap?.get(companyId as string) || 'N/A';
      return (
        <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span>{companyName}</span>
        </div>
      );
    }
  },
  {
    accessorKey: "product",
    header: "Product",
    cell: ({ row }) => {
        const product = row.original.product;
        if (!product) return 'N/A';
        
        const stockInfo = product.stock !== undefined ? `(Stock: ${product.stock})` : '';

        return (
            <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                    <div>{product.name}</div>
                    {stockInfo && <div className="text-xs text-muted-foreground">{stockInfo}</div>}
                </div>
            </div>
        )
    }
  },
  {
    accessorKey: "amount",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-right w-full justify-end"
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount)
 
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => new Intl.DateTimeFormat('en-US').format(new Date(row.getValue("date")))
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
        const type = row.getValue("type") as string;
        
        const typeStyles: { [key: string]: string } = {
          sales: 'bg-green-500/20 text-green-700 dark:text-green-300',
          purchases: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
          receipt: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
          payment: 'bg-red-500/20 text-red-700 dark:text-red-300',
          journal: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
        };

        const variant = type === 'sales' ? 'default' : 'secondary';
        return <Badge variant={variant} className={typeStyles[type]}>{type}</Badge>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const transaction = row.original
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
             <DropdownMenuItem onClick={() => generateInvoicePDF(transaction)} disabled={transaction.type !== 'sales'}>
                <FileDown className="mr-2 h-4 w-4" />
                <span>Generate Invoice</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(transaction)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit transaction</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(transaction)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete transaction</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
