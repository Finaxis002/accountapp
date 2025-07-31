import { invoices } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Invoices</h2>
        <p className="text-muted-foreground">
          Manage your invoices and track payments.
        </p>
      </div>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>A list of all invoices issued to your clients.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map(invoice => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                        {invoice.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{invoice.customerName}</TableCell>
                  <TableCell>{new Intl.DateTimeFormat('en-US').format(invoice.invoiceDate)}</TableCell>
                  <TableCell>{new Intl.DateTimeFormat('en-US').format(invoice.dueDate)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={invoice.status === 'Paid' ? 'default' : invoice.status === 'Pending' ? 'secondary' : 'destructive'}
                      className={invoice.status === 'Paid' ? 'bg-green-500/20 text-green-700' : ''}
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.items.reduce((sum, item) => sum + item.amount, 0))}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem asChild><Link href={`/invoices/${invoice.id}`}>View Invoice</Link></DropdownMenuItem>
                        <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
                        <DropdownMenuItem>Send Reminder</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
