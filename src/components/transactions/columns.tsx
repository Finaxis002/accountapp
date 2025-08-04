
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Copy, Edit, Trash2, FileDown } from "lucide-react"

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
}

export const columns = ({ generateInvoicePDF }: ColumnsProps): ColumnDef<Transaction>[] => [
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
    header: "Party",
    cell: ({ row }) => {
        const transaction = row.original
        const partyName = typeof transaction.party === 'object' && transaction.party !== null ? transaction.party.name : transaction.party;
        return (
            <div>
                <div className="font-medium">{partyName}</div>
                <div className="text-sm text-muted-foreground">{transaction.product?.name}</div>
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
        const variant = type === 'sales' ? 'default' : 'secondary';
        const colorClass = type === 'sales' 
            ? 'bg-green-500/20 text-green-700 dark:text-green-300' 
            : 'bg-orange-500/20 text-orange-700 dark:text-orange-300';
        return <Badge variant={variant} className={colorClass}>{type}</Badge>
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
             <DropdownMenuItem onClick={() => generateInvoicePDF(transaction)}>
                <FileDown className="mr-2 h-4 w-4" />
                <span>Generate Invoice</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit transaction</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete transaction</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
