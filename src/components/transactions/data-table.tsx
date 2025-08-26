"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  Cell,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card } from "../ui/card"
import { motion } from "framer-motion"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  })

  return (
    <Card className="w-full">
      {/* Search / Filter */}
      <div className="flex items-center p-4">
        <Input
          placeholder="Filter by party, product, or description..."
          value={(table.getColumn("party")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("party")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>

      {/* Desktop Table */}
      <div className="overflow-x-auto hidden md:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell: Cell<TData, TValue>) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

     {/* ✅ Mobile Card View - Redesigned with Icon Alignment */}
<div className="block md:hidden space-y-4 p-4">
  {table.getRowModel().rows?.length ? (
    table.getRowModel().rows.map((row, idx) => (
      <motion.div
        key={row.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.05 }}
      >
        <Card className="p-4 shadow-lg border rounded-xl bg-gradient-to-br from-card to-muted/20">
          <div className="grid gap-3">
            {row.getVisibleCells().map((cell: Cell<TData, TValue>) => (
              <div
                key={cell.id}
                className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0"
              >
                {/* Label */}
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {cell.column.columnDef.header as string}
                </span>

                {/* Value (icons + text aligned) */}
                <span className="text-sm font-semibold text-foreground flex items-center gap-2 text-right">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    ))
  ) : (
    <div className="text-center text-muted-foreground py-6">No results.</div>
  )}
</div>


      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
        <div className="text-sm text-muted-foreground flex-1">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  )
}
