
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
} from "@tanstack/react-table"
import { Cell } from "@tanstack/react-table"

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
        }
    }
  })

  return (
    <Card className="w-full">
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
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
      {table.getRowModel().rows?.length ? (
        table.getRowModel().rows.map((row) => (
          <TableRow
            key={row.id}
            className="hidden sm:table-row"
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

{/* ✅ Mobile Card View outside table but inside Card */}
<div className="sm:hidden mt-4">
  {table.getRowModel().rows?.length ? (
    table.getRowModel().rows.map((row) => (
      <div
        key={row.id}
        className="border rounded-lg p-4 mb-2 shadow-sm bg-white"
      >
        {row.getVisibleCells().map((cell) => (
          <div key={cell.id} className="flex justify-between py-1">
            <span className="font-semibold text-gray-600">
              {typeof cell.column.columnDef.header === "string"
                ? cell.column.columnDef.header
                : cell.column.columnDef.id}
            </span>
            <span>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </span>
          </div>
        ))}
      </div>
    ))
  ) : (
    <div className="text-center text-gray-500 py-4">No results.</div>
  )}
</div>
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
